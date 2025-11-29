"""
Training script for ReliefRoute ML models
Run this to train models from historical scenario data
"""
import sys
import os

# Add app directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.ml_models import train_models, load_training_data

if __name__ == "__main__":
    print("=" * 60)
    print("ReliefRoute ML Model Training")
    print("=" * 60)
    
    # Load training data
    scenarios, resources, risk_levels = load_training_data()
    
    print(f"\nLoaded {len(scenarios)} historical scenarios")
    
    if len(scenarios) < 5:
        print("\n⚠️  Warning: Not enough training data (minimum 5 scenarios required)")
        print("Models will use rule-based fallback logic.")
        print("\nTo improve ML predictions, add more historical scenario JSON files to:")
        print("  backend/app/data/scenarios/")
    else:
        print("\nTraining models...")
        results = train_models()
        
        print("\n" + "=" * 60)
        print("Training Results:")
        print("=" * 60)
        
        if results.get("status") == "insufficient_data":
            print("⚠️  Insufficient data for training")
        else:
            if "demand_model" in results:
                print("\n📊 Demand Prediction Model (LightGBM):")
                for resource, metrics in results["demand_model"].items():
                    if isinstance(metrics, dict) and "r2" in metrics:
                        print(f"  {resource}:")
                        print(f"    R² Score: {metrics['r2']:.3f}")
                        print(f"    MAE: {metrics['mae']:.1f}")
            
            if "classifier" in results:
                print("\n🎯 Risk Classifier (TF-IDF + Logistic Regression):")
                print(f"  Accuracy: {results['classifier'].get('accuracy', 0):.3f}")
        
        print("\n✅ Models saved to: backend/app/models/")
        print("\nModels will be automatically loaded when the agent starts.")

