from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import numpy as np
import re
import os
from pathlib import Path

app = Flask(__name__)
allowed_origins = [item.strip() for item in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",") if item.strip()]
CORS(app, origins=allowed_origins)
BASE_DIR = Path(__file__).resolve().parent


def load_category_predictor():
    """Load either the new comparison winner or the legacy Keras model."""
    metadata_path = BASE_DIR / "model_metadata.json"
    if metadata_path.exists():
        with open(metadata_path, "r", encoding="utf-8") as file:
            metadata = json.load(file)
        if metadata.get("model_type") == "linear_svm":
            with open(BASE_DIR / "best_category_model.pkl", "rb") as file:
                model = pickle.load(file)
            with open(BASE_DIR / "tfidf_vectorizer.pkl", "rb") as file:
                return "linear_svm", model, pickle.load(file)
        if metadata.get("model_type") == "keras":
            with open(BASE_DIR / "tokenizer.pkl", "rb") as file:
                return "keras", tf.keras.models.load_model(BASE_DIR / "best_category_model.keras"), pickle.load(file)
        raise ValueError("model_metadata.json contains an unsupported model type")

    with open(BASE_DIR / "tokenizer.pkl", "rb") as file:
        return "keras", tf.keras.models.load_model(BASE_DIR / "best_category_model.keras"), pickle.load(file)


CATEGORY_MODEL_TYPE, category_model, category_preprocessor = load_category_predictor()
with open(BASE_DIR / "label_encoder_cat.pkl", "rb") as file:
    le_cat = pickle.load(file)

SLANG_MAP = {"nt": "not", "wrking": "working", "intrnet": "internet", "vry": "very", "plzz": "please", "asap": "urgent", "paani": "water", "stink": "smell", "garbag": "garbage"}
CRITICAL_HAZARDS = ["spark", "sparking", "smoke", "fire", "burning", "blast", "short circuit", "shock", "electric shock"]
CATEGORY_PRIORITY_CAPS = {"Cleanliness": "Medium", "Academic Support And Resources": "Medium", "Academic": "Medium", "Furniture": "Medium", "IT & Network": "Medium", "Online Learning": "Medium", "Infrastructure": "Medium", "Sanitation": "Medium", "Electrical": "Critical", "Security": "Critical"}
PRIORITY_SCORE_MAP = {"Low": 25, "Medium": 50, "Critical": 95}


def clean_and_normalize(text):
    return " ".join(SLANG_MAP.get(word, word) for word in re.findall(r"\w+", text.lower()))


def predict_category(text):
    if CATEGORY_MODEL_TYPE == "linear_svm":
        class_index = category_model.predict(category_preprocessor.transform([text]))[0]
    else:
        sequence = category_preprocessor.texts_to_sequences([text])
        padded = pad_sequences(sequence, maxlen=100, padding="post", truncating="post")
        class_index = np.argmax(category_model.predict(padded, verbose=0)[0])
    return le_cat.inverse_transform([class_index])[0]


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json or {}
        station, title = data.get("station", ""), data.get("title", "")
        description = data.get("complaint", "") or data.get("description", "")
        raw_text = f"{station} {title} {description}".strip()
        normalized = clean_and_normalize(raw_text)
        category = predict_category(raw_text)
        if any(hazard in normalized for hazard in CRITICAL_HAZARDS):
            category, level, score = "Electrical", "Critical", 95
        else:
            base_score = 75 if any(word in normalized for word in ["burst", "flooding", "overflow", "blackout", "no water"]) else 50 if any(word in normalized for word in ["leak", "broken", "damaged", "not working", "repair"]) else 25
            if any(word in normalized for word in ["urgent", "asap", "immediately"]):
                base_score += 10
            calculated = "Critical" if base_score >= 75 else "Medium" if base_score >= 45 else "Low"
            maximum = CATEGORY_PRIORITY_CAPS.get(category, "Medium")
            ranks = {"Low": 1, "Medium": 2, "Critical": 3}
            level = maximum if ranks[calculated] > ranks[maximum] else calculated
            score = PRIORITY_SCORE_MAP[level]
        return jsonify({"category": category, "priorityLevel": level, "priorityScore": score, "modelType": CATEGORY_MODEL_TYPE, "success": True})
    except Exception as error:
        print(f"Prediction Error: {error}")
        return jsonify({"category": "General", "priorityLevel": "Low", "priorityScore": 25, "success": False}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "categoryModelType": CATEGORY_MODEL_TYPE})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("ML_PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "true")
