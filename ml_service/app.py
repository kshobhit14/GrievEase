from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import numpy as np
import re

app = Flask(__name__)
CORS(app)

# 1. Load Trained Keras Model & Artifacts
model = tf.keras.models.load_model('best_category_model.keras')

with open('tokenizer.pkl', 'rb') as f:
    tokenizer = pickle.load(f)

with open('label_encoder_cat.pkl', 'rb') as f:
    le_cat = pickle.load(f)

# Slang & Hinglish Normalizer
SLANG_MAP = {
    "nt": "not", "wrking": "working", "intrnet": "internet", 
    "vry": "very", "plzz": "please", "asap": "urgent", "paani": "water",
    "stink": "smell", "garbag": "garbage"
}

def clean_and_normalize(text):
    text = text.lower()
    words = re.findall(r'\w+', text)
    normalized = [SLANG_MAP.get(w, w) for w in words]
    return " ".join(normalized)

# Emergency Critical Hazards (Hard Cap: Critical)
CRITICAL_HAZARDS = ['spark', 'sparking', 'smoke', 'fire', 'burning', 'blast', 'short circuit', 'shock', 'electric shock']

# Category Priority Caps (Max Allowed Priority Level)
CATEGORY_PRIORITY_CAPS = {
    "Cleanliness": "Medium",
    "Academic Support And Resources": "Medium",
    "Academic": "Medium",
    "Furniture": "Medium",
    "IT & Network": "High",
    "Online Learning": "High",
    "Infrastructure": "High",
    "Sanitation": "High",
    "Electrical": "Critical",
    "Security": "Critical"
}

PRIORITY_LEVEL_MAP = {25: "Low", 50: "Medium", 75: "High", 95: "Critical"}

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json or {}
        station = data.get('station', '')
        title = data.get('title', '')
        description = data.get('complaint', '') or data.get('description', '')

        raw_text = f"{station} {title} {description}".strip()
        normalized_text = clean_and_normalize(raw_text)

        # -------------------------------------------------------------
        # STEP 1: Deep Learning Model Prediction for Category
        # -------------------------------------------------------------
        sequences = tokenizer.texts_to_sequences([raw_text])
        padded_seq = pad_sequences(sequences, maxlen=100, padding='post', truncating='post')
        
        predictions = model.predict(padded_seq, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        category = le_cat.inverse_transform([predicted_class_idx])[0]

        # -------------------------------------------------------------
        # STEP 2: Contextual Priority Calculation with Category Caps
        # -------------------------------------------------------------
        base_score = 25  # Default: Low

        # Emergency Hazard Check (Highest Priority Rule)
        is_critical_hazard = any(hazard in normalized_text for hazard in CRITICAL_HAZARDS)

        if is_critical_hazard:
            category = "Electrical"
            priority_level = "Critical"
            priority_score = 95
        else:
            # Base score by category & issue impact
            if any(w in normalized_text for w in ["burst", "flooding", "overflow", "blackout", "no water"]):
                base_score = 75  # High impact issue
            elif any(w in normalized_text for w in ["leak", "broken", "damaged", "not working", "repair"]):
                base_score = 50  # Medium impact issue
            else:
                base_score = 25  # Low impact issue

            # Small boost for urgency words (+10 score, NOT direct jump to High)
            if any(w in normalized_text for w in ["urgent", "asap", "immediately"]):
                base_score += 10

            # Determine Priority Level before Cap
            if base_score >= 75:
                calculated_level = "High"
            elif base_score >= 45:
                calculated_level = "Medium"
            else:
                calculated_level = "Low"

            # Apply Category Cap (Prevents "Dirty desk ASAP" from becoming High)
            max_allowed = CATEGORY_PRIORITY_CAPS.get(category, "High")
            
            # Cap logic
            priority_rank = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
            if priority_rank[calculated_level] > priority_rank[max_allowed]:
                priority_level = max_allowed
            else:
                priority_level = calculated_level

            priority_score = min(base_score, 75 if max_allowed == "High" else (50 if max_allowed == "Medium" else 25))

        print(f"[PREDICTION] Input: '{title}' -> Category: {category} | Priority: {priority_level} (Score: {priority_score})")

        return jsonify({
            "category": category,
            "priorityLevel": priority_level,
            "priorityScore": priority_score,
            "success": True
        })

    except Exception as e:
        print(f"Prediction Error: {str(e)}")
        return jsonify({"category": "General", "priorityLevel": "Low", "priorityScore": 25, "success": False}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)