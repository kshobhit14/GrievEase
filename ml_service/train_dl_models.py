import pandas as pd
import numpy as np
import pickle
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, Conv1D, GlobalMaxPooling1D, Dense, Dropout, SpatialDropout1D, Bidirectional, LSTM, GRU
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# 1. Load Dataset
df = pd.read_csv('../Final_Dataset.csv')

# Feature: Combine Station + Complaint text for maximum context
X_text = (df['station'] + " " + df['complaint']).values

# Targets
y_category_raw = df['category'].values
y_priority_raw = df['priorityLevel'].values

# Encode Labels
le_cat = LabelEncoder()
y_cat = le_cat.fit_transform(y_category_raw)

le_prio = LabelEncoder()
y_prio = le_prio.fit_transform(y_priority_raw)

num_cat_classes = len(le_cat.classes_)
num_prio_classes = len(le_prio.classes_)

# 2. Text Tokenization & Padding
vocab_size = 5000
max_length = 100
embedding_dim = 128

tokenizer = Tokenizer(num_words=vocab_size, oov_token="<OOV>")
tokenizer.fit_on_texts(X_text)

sequences = tokenizer.texts_to_sequences(X_text)
X_padded = pad_sequences(sequences, maxlen=max_length, padding='post', truncating='post')

# Split Data (80% Train, 20% Test)
X_train, X_test, y_train, y_test = train_test_split(
    X_padded, y_cat, test_size=0.2, random_state=42, stratify=y_cat
)

# 3. Define 3 Deep Learning Architectures (Category Classification)
def build_1d_cnn():
    model = Sequential([
        Embedding(vocab_size, embedding_dim),
        SpatialDropout1D(0.2),
        Conv1D(128, 5, activation='relu'),
        GlobalMaxPooling1D(),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(num_cat_classes, activation='softmax')
    ])
    model.compile(loss='sparse_categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
    return model

def build_bilstm():
    model = Sequential([
        Embedding(vocab_size, embedding_dim),
        SpatialDropout1D(0.2),
        Bidirectional(LSTM(64, dropout=0.2, recurrent_dropout=0.2)),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(num_cat_classes, activation='softmax')
    ])
    model.compile(loss='sparse_categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
    return model

def build_gru():
    model = Sequential([
        Embedding(vocab_size, embedding_dim),
        SpatialDropout1D(0.2),
        GRU(64, dropout=0.2, recurrent_dropout=0.2),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(num_cat_classes, activation='softmax')
    ])
    model.compile(loss='sparse_categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
    return model

models = {
    '1D CNN': build_1d_cnn(),
    'Bi-LSTM': build_bilstm(),
    'GRU': build_gru()
}

# 4. Train & Compare Models
results = {}
trained_models = {}

print("--- Starting Deep Learning Model Comparisons ---")
for name, model in models.items():
    print(f"\nTraining {name} Model...")
    history = model.fit(
        X_train, y_train, 
        epochs=10, 
        batch_size=32, 
        validation_data=(X_test, y_test), 
        verbose=1
    )
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    results[name] = accuracy
    trained_models[name] = model
    print(f"{name} Validation Accuracy: {accuracy * 100:.2f}%")

# 5. Select Best Model
best_model_name = max(results, key=results.get)
best_accuracy = results[best_model_name]

print("\n================ FINAL RESULTS ================")
for name, acc in results.items():
    print(f"{name}: {acc * 100:.2f}%")
print(f"\nWinner Model: {best_model_name} with {best_accuracy * 100:.2f}% Accuracy!")

# Save Best Model and Preprocessing Artifacts
best_model = trained_models[best_model_name]
best_model.save('best_category_model.keras')

with open('tokenizer.pkl', 'wb') as f:
    pickle.dump(tokenizer, f)

with open('label_encoder_cat.pkl', 'wb') as f:
    pickle.dump(le_cat, f)

with open('label_encoder_prio.pkl', 'wb') as f:
    pickle.dump(le_prio, f)

print("\nModel & Tokenizer artifacts saved successfully!")