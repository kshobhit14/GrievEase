"""Compare category classifiers and save the macro-F1 winner."""
import json
import pickle
import random
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import LinearSVC
from sklearn.utils.class_weight import compute_class_weight
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.layers import Bidirectional, Conv1D, Dense, Dropout, Embedding, GlobalMaxPooling1D, GRU, SpatialDropout1D
from tensorflow.keras.models import Sequential
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR.parent / "Final_Dataset.csv"
SEED, VOCAB_SIZE, MAX_LENGTH, EMBEDDING_DIM = 42, 5000, 100, 128
EPOCHS, BATCH_SIZE = 25, 32


def seed_everything():
    random.seed(SEED)
    np.random.seed(SEED)
    tf.keras.utils.set_random_seed(SEED)


def build_cnn(class_count):
    model = Sequential([
        Embedding(VOCAB_SIZE, EMBEDDING_DIM, input_length=MAX_LENGTH), SpatialDropout1D(0.2),
        Conv1D(128, 5, activation="relu"), GlobalMaxPooling1D(), Dense(64, activation="relu"),
        Dropout(0.3), Dense(class_count, activation="softmax"),
    ])
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return model


def build_bigru(class_count):
    model = Sequential([
        Embedding(VOCAB_SIZE, EMBEDDING_DIM, input_length=MAX_LENGTH), SpatialDropout1D(0.2),
        Bidirectional(GRU(64, dropout=0.2)), Dense(64, activation="relu"), Dropout(0.3),
        Dense(class_count, activation="softmax"),
    ])
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return model


def evaluate(name, actual, predicted, encoder):
    labels = list(range(len(encoder.classes_)))
    result = {
        "macro_f1": round(float(f1_score(actual, predicted, average="macro", zero_division=0)), 4),
        "weighted_f1": round(float(f1_score(actual, predicted, average="weighted", zero_division=0)), 4),
        "accuracy": round(float(np.mean(np.asarray(actual) == np.asarray(predicted))), 4),
        "classification_report": classification_report(actual, predicted, labels=labels, target_names=encoder.classes_, output_dict=True, zero_division=0),
    }
    matrix = confusion_matrix(actual, predicted, labels=labels)
    pd.DataFrame(matrix, index=encoder.classes_, columns=encoder.classes_).to_csv(BASE_DIR / f"confusion_matrix_{name}.csv")
    return result


def main():
    seed_everything()
    df = pd.read_csv(DATASET_PATH).dropna(subset=["complaint", "station", "category"])
    texts = (df["station"].astype(str).str.strip() + " " + df["complaint"].astype(str).str.strip()).to_numpy()
    encoder = LabelEncoder()
    targets = encoder.fit_transform(df["category"])
    train_texts, test_texts, y_train, y_test = train_test_split(texts, targets, test_size=0.2, random_state=SEED, stratify=targets)
    class_count = len(encoder.classes_)
    results, models = {}, {}

    print("Training TF-IDF + Linear SVM...")
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True, max_features=20000)
    x_train_tfidf, x_test_tfidf = vectorizer.fit_transform(train_texts), vectorizer.transform(test_texts)
    svm = LinearSVC(class_weight="balanced", random_state=SEED).fit(x_train_tfidf, y_train)
    results["TF-IDF + Linear SVM"] = evaluate("linear_svm", y_test, svm.predict(x_test_tfidf), encoder)
    models["TF-IDF + Linear SVM"] = {"type": "linear_svm", "model": svm, "vectorizer": vectorizer}

    tokenizer = Tokenizer(num_words=VOCAB_SIZE, oov_token="<OOV>")
    tokenizer.fit_on_texts(train_texts)
    sequences = pad_sequences(tokenizer.texts_to_sequences(train_texts), maxlen=MAX_LENGTH, padding="post", truncating="post")
    test_sequences = pad_sequences(tokenizer.texts_to_sequences(test_texts), maxlen=MAX_LENGTH, padding="post", truncating="post")
    x_fit, x_validation, y_fit, y_validation = train_test_split(sequences, y_train, test_size=0.2, random_state=SEED, stratify=y_train)
    weights = dict(enumerate(compute_class_weight(class_weight="balanced", classes=np.unique(y_train), y=y_train)))

    for name, builder in {"1D CNN": build_cnn, "BiGRU": build_bigru}.items():
        print(f"Training {name}...")
        model = builder(class_count)
        model.fit(
            x_fit, y_fit, validation_data=(x_validation, y_validation), epochs=EPOCHS, batch_size=BATCH_SIZE,
            class_weight=weights,
            callbacks=[EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True), ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-5)],
            verbose=1,
        )
        predictions = np.argmax(model.predict(test_sequences, verbose=0), axis=1)
        results[name] = evaluate(name.lower().replace(" ", "_"), y_test, predictions, encoder)
        models[name] = {"type": "keras", "model": model}

    winner = max(results, key=lambda name: results[name]["macro_f1"])
    print("\nFinal results (winner selected by macro F1):")
    for name, scores in results.items():
        print(f"{name}: macro F1={scores['macro_f1']:.4f}, weighted F1={scores['weighted_f1']:.4f}, accuracy={scores['accuracy']:.4f}")
    print(f"Winner: {winner}")

    with open(BASE_DIR / "label_encoder_cat.pkl", "wb") as file:
        pickle.dump(encoder, file)
    selected = models[winner]
    metadata = {"best_model_name": winner, "model_type": selected["type"], "input_format": "station + complaint text", "selection_metric": "macro_f1", "results": results}
    with open(BASE_DIR / "model_metadata.json", "w", encoding="utf-8") as file:
        json.dump(metadata, file, indent=2)
    if selected["type"] == "linear_svm":
        with open(BASE_DIR / "best_category_model.pkl", "wb") as file:
            pickle.dump(selected["model"], file)
        with open(BASE_DIR / "tfidf_vectorizer.pkl", "wb") as file:
            pickle.dump(selected["vectorizer"], file)
        print("Saved Linear SVM model and TF-IDF vectorizer.")
    else:
        selected["model"].save(BASE_DIR / "best_category_model.keras")
        with open(BASE_DIR / "tokenizer.pkl", "wb") as file:
            pickle.dump(tokenizer, file)
        print("Saved Keras model and tokenizer.")


if __name__ == "__main__":
    main()
