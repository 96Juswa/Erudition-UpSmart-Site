# app.py - Python Flask API for ML Model
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
import sys
import warnings

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js to call this API

# Load the trained model once when server starts
MODEL_PATH = os.getenv('MODEL_PATH', './models/trust_pipeline_best.joblib')
model = None

def load_model():
    global model
    try:
        # Suppress sklearn warnings during loading
        warnings.filterwarnings('ignore', category=UserWarning)
        
        print(f"📦 Attempting to load model from {MODEL_PATH}")
        print(f"🐍 Python version: {sys.version}")
        print(f"📊 Pandas version: {pd.__version__}")
        
        try:
            import sklearn
            print(f"🔧 Scikit-learn version: {sklearn.__version__}")
        except ImportError:
            print("⚠️ Scikit-learn not found, attempting to import")
        
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            print(f"❌ Model file not found at {MODEL_PATH}")
            print(f"📁 Current directory: {os.getcwd()}")
            print(f"📂 Files in models/: {os.listdir('./models') if os.path.exists('./models') else 'models directory not found'}")
            return False
        
        # Try loading model with compatibility fixes
        try:
            # First attempt: Load normally
            model = joblib.load(MODEL_PATH)
            print(f"✅ Model loaded successfully (standard method)")
            
        except AttributeError as e:
            if "'ColumnTransformer' object has no attribute" in str(e):
                print(f"⚠️ ColumnTransformer compatibility issue detected")
                print(f"🔧 Attempting compatibility fix...")
                
                # Try loading with sklearn compatibility
                import sklearn.compose
                from sklearn.utils import _safe_indexing
                
                # Patch the ColumnTransformer if needed
                if not hasattr(sklearn.compose.ColumnTransformer, '_name_to_fitted_passthrough'):
                    sklearn.compose.ColumnTransformer._name_to_fitted_passthrough = {}
                
                model = joblib.load(MODEL_PATH)
                print(f"✅ Model loaded with compatibility patch")
            else:
                raise
        
        print(f"📋 Model type: {type(model)}")
        
        # Test the model with dummy data
        test_features = {
            'PortfolioCount': 5,
            'AverageRatings': 4.0,
            'TransactionCount': 10,
            'CompletedTransactions': 9,
            'ReviewCount': 5,
            'StarCount': 20,
            'PositiveReviews': 4,
            'NeutralReviews': 1,
            'NegativeReviews': 0,
            'CompletionRate': 90.0,
            'CancellationRate': 10.0,
            'BioLength': 100,
            'BioWordCount': 20,
            'PositiveReviewRatio': 0.8,
            'ReviewCoverage': 0.5,
            'EngagementIndex': 150
        }
        
        test_df = pd.DataFrame([test_features])
        test_prediction = model.predict(test_df)[0]
        print(f"🧪 Test prediction: {test_prediction:.2f}")
        print(f"✅ Model is ready for predictions")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        import traceback
        traceback.print_exc()
        model = None
        return False

def calculate_fallback_trust_score(user_data):
    """
    Fallback rule-based trust score calculation when ML model is unavailable.
    Returns a score on 0-100 scale.
    """
    try:
        portfolio_count = user_data.get('portfolioCount', 0)
        avg_ratings = user_data.get('averageRatings', 1.0)
        transaction_count = user_data.get('transactionCount', 0)
        completed_transactions = user_data.get('completedTransactions', 0)
        review_count = user_data.get('reviewCount', 0)
        positive_reviews = user_data.get('positiveReviews', 0)
        negative_reviews = user_data.get('negativeReviews', 0)
        
        # Base score from ratings (0-30 points)
        rating_score = ((avg_ratings - 1) / 4) * 30
        
        # Activity score (0-25 points)
        activity_score = min(transaction_count / 20, 1) * 25
        
        # Completion rate (0-25 points)
        completion_rate = safe_div(completed_transactions, transaction_count)
        completion_score = completion_rate * 25
        
        # Review positivity (0-15 points)
        if review_count > 0:
            positivity = safe_div(positive_reviews, review_count)
            review_score = positivity * 15
        else:
            review_score = 7.5  # Neutral score
        
        # Portfolio bonus (0-5 points)
        portfolio_score = min(portfolio_count / 10, 1) * 5
        
        # Calculate total
        total_score = (
            rating_score +
            activity_score +
            completion_score +
            review_score +
            portfolio_score
        )
        
        # Penalties
        if negative_reviews > 0 and review_count > 0:
            negative_ratio = negative_reviews / review_count
            total_score -= (negative_ratio * 20)
        
        # Clamp between 0-100
        total_score = max(0, min(100, total_score))
        
        return total_score
        
    except Exception as e:
        print(f"⚠️ Error in fallback calculation: {e}")
        return 50.0  # Default neutral score

# Load model on startup
model_loaded = load_model()

def safe_div(a, b):
    """Safe division to avoid divide by zero"""
    return a / b if b != 0 else 0.0

def calculate_features(user_data):
    """
    Calculate all features needed by the model from user data.
    This mirrors the preprocessing in Data_Preprocessing.ipynb
    """
    # Extract raw data
    portfolio_count = user_data.get('portfolioCount', 0)
    avg_ratings = user_data.get('averageRatings', 1.0)
    transaction_count = user_data.get('transactionCount', 0)
    completed_transactions = user_data.get('completedTransactions', 0)
    review_count = user_data.get('reviewCount', 0)
    star_count = user_data.get('starCount', 0)
    positive_reviews = user_data.get('positiveReviews', 0)
    neutral_reviews = user_data.get('neutralReviews', 0)
    negative_reviews = user_data.get('negativeReviews', 0)
    bio_length = user_data.get('bioLength', 0)
    bio_word_count = user_data.get('bioWordCount', 0)
    
    # Ensure non-negative values
    portfolio_count = max(0, portfolio_count)
    avg_ratings = max(1.0, min(5.0, avg_ratings))
    transaction_count = max(0, transaction_count)
    completed_transactions = max(0, completed_transactions)
    review_count = max(0, review_count)
    star_count = max(0, star_count)
    positive_reviews = max(0, positive_reviews)
    neutral_reviews = max(0, neutral_reviews)
    negative_reviews = max(0, negative_reviews)
    
    # Ensure consistency
    transaction_count = max(transaction_count, completed_transactions)
    total_sentiment_reviews = positive_reviews + neutral_reviews + negative_reviews
    review_count = max(review_count, total_sentiment_reviews)
    
    # Calculate derived features
    completion_rate = safe_div(completed_transactions * 100.0, transaction_count)
    completion_rate = min(100.0, max(0.0, completion_rate))
    
    cancelled = max(0, transaction_count - completed_transactions)
    cancellation_rate = safe_div(cancelled * 100.0, transaction_count)
    cancellation_rate = min(100.0, max(0.0, cancellation_rate))
    
    positive_review_ratio = safe_div(positive_reviews, review_count)
    positive_review_ratio = min(1.0, max(0.0, positive_review_ratio))
    
    review_coverage = safe_div(review_count, transaction_count)
    review_coverage = min(1.0, max(0.0, review_coverage))

    engagement_index = (
        transaction_count + 
        review_count + 
        portfolio_count + 
        bio_length + 
        bio_word_count
    )
    
    # Create feature dictionary matching model's expected input
    features = {
        'PortfolioCount': portfolio_count,
        'AverageRatings': avg_ratings,
        'TransactionCount': transaction_count,
        'CompletedTransactions': completed_transactions,
        'ReviewCount': review_count,
        'StarCount': star_count,
        'PositiveReviews': positive_reviews,
        'NeutralReviews': neutral_reviews,
        'NegativeReviews': negative_reviews,
        'CompletionRate': completion_rate,
        'CancellationRate': cancellation_rate,
        'BioLength': bio_length,
        'BioWordCount': bio_word_count,
        'PositiveReviewRatio': positive_review_ratio,
        'ReviewCoverage': review_coverage,
        'EngagementIndex': engagement_index,
        'TrustRating': 0  # Placeholder, will be predicted
    }
    
    return features

def convert_to_likert_scale(prediction_0_100):
    """
    Convert prediction from 0-100 scale to 1-5 Likert scale.
    
    Mapping:
    0-100 → 1-5
    0 → 1.0
    25 → 2.0
    50 → 3.0
    75 → 4.0
    100 → 5.0
    """
    likert_score = 1.0 + (prediction_0_100 / 100.0) * 4.0
    # Ensure it stays within 1-5 range
    likert_score = max(1.0, min(5.0, likert_score))
    return likert_score

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'fallback_available': True
    })

@app.route('/predict', methods=['POST'])
def predict_trust_rating():
    """
    Predict trust rating for a user.
    
    Expected JSON body:
    {
        "portfolioCount": 10,
        "averageRatings": 4.5,
        "transactionCount": 100,
        "completedTransactions": 95,
        "reviewCount": 50,
        "starCount": 225,
        "positiveReviews": 45,
        "neutralReviews": 3,
        "negativeReviews": 2,
        "bioLength": 150,
        "bioWordCount": 25
    }
    
    Returns trust rating on Likert scale (1-5)
    """
    try:
        user_data = request.json
        
        if not user_data:
            return jsonify({
                'error': 'No data provided',
                'success': False
            }), 400
        
        used_fallback = False
        
        # Try ML model first
        if model is not None:
            try:
                # Calculate all features
                features = calculate_features(user_data)
                
                # Create DataFrame with correct column order
                feature_df = pd.DataFrame([features])
                
                # Remove TrustRating from features (it's the target)
                if 'TrustRating' in feature_df.columns:
                    feature_df = feature_df.drop(columns=['TrustRating'])
                
                # Make prediction (model outputs 0-100)
                prediction_0_100 = model.predict(feature_df)[0]
                
                # Ensure prediction is within 0-100 range first
                prediction_0_100 = float(max(0.0, min(100.0, prediction_0_100)))
                
            except Exception as model_error:
                print(f"⚠️ ML prediction failed: {model_error}, using fallback")
                prediction_0_100 = calculate_fallback_trust_score(user_data)
                used_fallback = True
        else:
            # Use fallback if model not loaded
            print(f"⚠️ Model not available, using fallback calculation")
            prediction_0_100 = calculate_fallback_trust_score(user_data)
            used_fallback = True
        
        # Convert to Likert scale (1-5)
        trust_rating_likert = convert_to_likert_scale(prediction_0_100)
        
        return jsonify({
            'success': True,
            'trustRating': round(trust_rating_likert, 2),
            'trustScore': round(prediction_0_100, 2),
            'method': 'fallback' if used_fallback else 'ml_model',
            'message': 'Trust rating calculated successfully'
        })
        
    except Exception as e:
        import traceback
        print(f"❌ Error during prediction: {e}")
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    Predict trust ratings for multiple users at once.
    
    Expected JSON body:
    {
        "users": [
            { user_data_1 },
            { user_data_2 },
            ...
        ]
    }
    
    Returns trust ratings on Likert scale (1-5)
    """
    try:
        data = request.json
        users = data.get('users', [])
        
        if not users:
            return jsonify({
                'error': 'No users provided',
                'success': False
            }), 400
        
        results = []
        for user_data in users:
            used_fallback = False
            
            if model is not None:
                try:
                    features = calculate_features(user_data)
                    feature_df = pd.DataFrame([features])
                    
                    if 'TrustRating' in feature_df.columns:
                        feature_df = feature_df.drop(columns=['TrustRating'])
                    
                    # Make prediction (model outputs 0-100)
                    prediction_0_100 = model.predict(feature_df)[0]
                    prediction_0_100 = float(max(0.0, min(100.0, prediction_0_100)))
                    
                except Exception:
                    prediction_0_100 = calculate_fallback_trust_score(user_data)
                    used_fallback = True
            else:
                prediction_0_100 = calculate_fallback_trust_score(user_data)
                used_fallback = True
            
            # Convert to Likert scale (1-5)
            trust_rating_likert = convert_to_likert_scale(prediction_0_100)
            
            results.append({
                'userId': user_data.get('userId'),
                'trustRating': round(trust_rating_likert, 2),
                'method': 'fallback' if used_fallback else 'ml_model'
            })
        
        return jsonify({
            'success': True,
            'predictions': results,
            'count': len(results)
        })
        
    except Exception as e:
        import traceback
        print(f"❌ Error during batch prediction: {e}")
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"\n{'='*60}")
    print(f"🚀 Starting Flask ML Service on port {port}")
    print(f"📊 Model Status: {'✅ Loaded' if model is not None else '⚠️ Using Fallback'}")
    print(f"{'='*60}\n")
    app.run(host='0.0.0.0', port=port, debug=True)