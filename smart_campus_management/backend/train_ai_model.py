#!/usr/bin/env python3
"""
AI Model Training Script for Smart Campus AI Assistant
Trains a text classification model to categorize user queries and provide contextual responses.
"""

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import joblib
import json
import os

def train_model():
    """Train the AI model for query classification"""

    # Load training data
    df = pd.read_csv('ai_training_data.csv')

    # Prepare features and labels
    X = df['input']
    y = df['response_category']

    # Create pipeline with TF-IDF vectorizer and Naive Bayes classifier
    model = Pipeline([
        ('tfidf', TfidfVectorizer(
            lowercase=True,
            stop_words='english',
            ngram_range=(1, 2),
            max_features=1000
        )),
        ('clf', MultinomialNB(alpha=0.1))
    ])

    # Train the model
    print("Training AI model...")
    model.fit(X, y)

    # Save the model
    joblib.dump(model, 'ai_model.joblib')
    print("Model saved as ai_model.joblib")

    # Create response mapping
    responses = {}
    for _, row in df.iterrows():
        category = row['response_category']
        if category not in responses:
            responses[category] = row['response']

    # Save responses as JSON
    with open('ai_responses.json', 'w') as f:
        json.dump(responses, f, indent=2)
    print("Responses saved as ai_responses.json")

    # Test the model
    test_inputs = [
        "check my fees",
        "overdue payments",
        "payment methods",
        "generate report"
    ]

    print("\nModel Test Results:")
    for test_input in test_inputs:
        prediction = model.predict([test_input])[0]
        print(f"Input: '{test_input}' -> Category: {prediction}")

if __name__ == "__main__":
    train_model()