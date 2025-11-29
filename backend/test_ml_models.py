"""
Test ML models to verify they work correctly
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.ml_models import DemandPredictionModel, ScenarioClassifier
import pickle

def test_models():
    print("=" * 60)
    print("Testing ML Models")
    print("=" * 60)
    
    model_dir = os.path.join(os.path.dirname(__file__), 'app', 'models')
    
    # Test demand prediction model
    print("\n📊 Testing Demand Prediction Model...")
    demand_model = DemandPredictionModel()
    demand_model.load(model_dir)
    
    if demand_model.is_trained:
        print("   ✅ Model loaded successfully")
        
        # Test prediction
        test_scenario = {
            "disaster_type": "flood",
            "severity_level": 4,
            "population_affected": 25000,
            "hospital_load_pct": 75,
            "zones_impacted": ["East", "South"],
            "blocked_roads": ["OMR", "ECR"],
            "disaster_specific": {
                "flood": {
                    "water_level_m": 1.2,
                    "rainfall_mm_24h": 250,
                    "inland_or_coastal": "coastal"
                }
            }
        }
        
        prediction = demand_model.predict(test_scenario)
        print(f"   📦 Test prediction for severity 4 flood (25k people):")
        print(f"      Medical kits: {prediction.get('medical_kits_required', 'N/A')}")
        print(f"      Food packets: {prediction.get('food_packets_required', 'N/A')}")
        print(f"      Water liters: {prediction.get('water_liters_required', 'N/A')}")
        print(f"      Shelter kits: {prediction.get('shelter_kits_required', 'N/A')}")
        
        # Get feature importance
        importance = demand_model.get_feature_importance()
        if importance:
            print("\n   🔍 Top features (medical_kits):")
            if "medical_kits" in importance:
                top_features = sorted(importance["medical_kits"].items(), key=lambda x: x[1], reverse=True)[:5]
                for feat, imp in top_features:
                    print(f"      - {feat}: {imp:.2f}")
    else:
        print("   ❌ Model not loaded")
    
    # Test risk classifier
    print("\n\n🎯 Testing Risk Classifier...")
    classifier = ScenarioClassifier()
    
    classifier_path = os.path.join(model_dir, 'classifier.pkl')
    if os.path.exists(classifier_path):
        with open(classifier_path, 'rb') as f:
            classifier_data = pickle.load(f)
        classifier.vectorizer = classifier_data.get('vectorizer')
        classifier.model = classifier_data.get('model')
        classifier.num_features_count = classifier_data.get('num_features_count', 5)
        classifier.is_trained = True
        
        print("   ✅ Classifier loaded successfully")
        
        # Test predictions at different severity levels
        test_scenarios = [
            {"disaster_type": "flood", "severity_level": 1, "population_affected": 5000, "hospital_load_pct": 30, "zones_impacted": ["East"], "blocked_roads": [], "notes": "Minor flood"},
            {"disaster_type": "earthquake", "severity_level": 3, "population_affected": 20000, "hospital_load_pct": 60, "zones_impacted": ["Central", "West"], "blocked_roads": ["Anna Salai"], "notes": "Moderate earthquake"},
            {"disaster_type": "cyclone", "severity_level": 4, "population_affected": 50000, "hospital_load_pct": 80, "zones_impacted": ["East", "South", "Central"], "blocked_roads": ["OMR", "ECR"], "notes": "Severe cyclone"},
            {"disaster_type": "heatwave", "severity_level": 5, "population_affected": 80000, "hospital_load_pct": 95, "zones_impacted": ["All"], "blocked_roads": [], "notes": "Critical heatwave"},
        ]
        
        print("\n   📋 Test predictions:")
        for scenario in test_scenarios:
            risk = classifier.predict_risk_level(scenario)
            print(f"      Severity {scenario['severity_level']} {scenario['disaster_type']}: {risk}")
    else:
        print("   ❌ Classifier not found")
    
    # Test agent integration
    print("\n\n🤖 Testing Agent Integration...")
    try:
        from app.agent import agent
        print(f"   ✅ Agent initialized")
        print(f"   ML Models loaded: {agent.ml_models_loaded}")
        print(f"   Demand model ready: {agent.demand_model.is_trained}")
        print(f"   Risk classifier ready: {agent.risk_classifier.is_trained}")
        
        # Test a full scenario
        from app.models import ScenarioInput, AvailableResources, DisasterSpecificData, FloodSpecific
        
        test_input = ScenarioInput(
            city="Chennai",
            disaster_type="flood",
            severity_level=3,
            severity_label="High",
            population_affected=15000,
            zones_impacted=["East", "South"],
            hospital_load_pct=65,
            blocked_roads=["OMR"],
            available_resources=AvailableResources(
                medical_kits_available=1000,
                boats_available=5,
                drones_available=3,
                trucks_available=10
            ),
            disaster_specific=DisasterSpecificData(
                flood=FloodSpecific(
                    water_level_m=0.8,
                    rainfall_mm_24h=180,
                    inland_or_coastal="coastal"
                )
            ),
            notes="Test scenario"
        )
        
        decision = agent.run_from_input(test_input)
        print(f"\n   📊 Full decision test:")
        print(f"      Decision ID: {decision.id}")
        print(f"      Risk Level: {decision.risk_level}")
        print(f"      Supply Gap: {decision.supply_gap}")
        print(f"      Coverage: {decision.estimated_coverage}%")
        print(f"      Routes: {len(decision.selected_routes)}")
        
        if decision.ml_interpretability:
            print(f"      ML Method: {decision.ml_interpretability.get('prediction_method', 'N/A')}")
        
    except Exception as e:
        print(f"   ❌ Agent test failed: {e}")
    
    print("\n" + "=" * 60)
    print("Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_models()


# touch update 11/29/2025 12:45:26
