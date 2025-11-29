"""
ML Models for ReliefRoute Demand Prediction
- TF-IDF + Logistic Regression for text-based scenario classification
- LightGBM for resource demand prediction
"""
import os
import json
import pickle
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, mean_absolute_error, r2_score
    import lightgbm as lgb
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: scikit-learn and lightgbm not installed. ML models will use fallback logic.")


class DemandPredictionModel:
    """LightGBM model for predicting resource demand"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler() if SKLEARN_AVAILABLE else None
        self.feature_names = []
        self.feature_importance_ = None
        self.is_trained = False
        
    def _extract_features(self, scenario: Dict) -> np.ndarray:
        """Extract numerical features from scenario"""
        disaster_type = scenario.get("disaster_type", "flood")
        severity = scenario.get("severity_level", scenario.get("severity", 3))
        population = scenario.get("population_affected", 10000)
        hospital_load = scenario.get("hospital_load_pct", scenario.get("hospital_load", 50))
        zones_count = len(scenario.get("zones_impacted", scenario.get("zones_affected", [])))
        blocked_roads_count = len(scenario.get("blocked_roads", []))
        
        # Normalize hospital load
        if hospital_load > 1:
            hospital_load = hospital_load / 100.0
        
        # Disaster type encoding
        disaster_encoding = {
            "flood": [1, 0, 0, 0],
            "cyclone": [0, 1, 0, 0],
            "earthquake": [0, 0, 1, 0],
            "heatwave": [0, 0, 0, 1]
        }
        disaster_vec = disaster_encoding.get(disaster_type, [0.25, 0.25, 0.25, 0.25])
        
        # Disaster-specific features
        disaster_specific = scenario.get("disaster_specific", {})
        flood_features = [0, 0, 0]
        cyclone_features = [0, 0, 0]
        earthquake_features = [0, 0, 0]
        heatwave_features = [0, 0, 0]
        
        if disaster_type == "flood" and disaster_specific.get("flood"):
            flood_data = disaster_specific["flood"]
            flood_features = [
                flood_data.get("water_level_m", 0.5),
                flood_data.get("rainfall_mm_24h", 100) / 500.0,  # Normalize
               1.0 if flood_data.get("inland_or_coastal") == "coastal" else 0.0
            ]
        elif disaster_type == "cyclone" and disaster_specific.get("cyclone"):
            cyclone_data = disaster_specific["cyclone"]
            cyclone_features = [
                cyclone_data.get("max_wind_speed_kmph", 120) / 200.0,  # Normalize
                cyclone_data.get("cyclone_translation_speed_kmph", 20) / 50.0,
                1.0 if cyclone_data.get("cyclone_direction") in ["NE", "E", "SE"] else 0.0
            ]
        elif disaster_type == "earthquake" and disaster_specific.get("earthquake"):
            eq_data = disaster_specific["earthquake"]
            earthquake_features = [
                eq_data.get("magnitude", 5.0) / 10.0,  # Normalize
                eq_data.get("epicenter_distance_km", 50) / 200.0,
                eq_data.get("building_collapse_ratio", 0.1)
            ]
        elif disaster_type == "heatwave" and disaster_specific.get("heatwave"):
            heat_data = disaster_specific["heatwave"]
            heatwave_features = [
                heat_data.get("max_temp_c", 45) / 50.0,  # Normalize
                heat_data.get("humidity_pct", 30) / 100.0,
                heat_data.get("duration_days", 3) / 10.0
            ]
        
        # Combine all features
        features = [
            severity / 5.0,  # Normalize severity
            np.log1p(population) / 15.0,  # Log-normalized population
            hospital_load,
            zones_count / 5.0,  # Normalize zone count
            blocked_roads_count / 5.0,
        ] + disaster_vec + flood_features + cyclone_features + earthquake_features + heatwave_features
        
        self.feature_names = [
            "severity", "log_population", "hospital_load", "zones_count", "blocked_roads",
            "is_flood", "is_cyclone", "is_earthquake", "is_heatwave",
            "flood_water_level", "flood_rainfall", "flood_coastal",
            "cyclone_wind", "cyclone_speed", "cyclone_eastward",
            "eq_magnitude", "eq_distance", "eq_collapse",
            "heat_temp", "heat_humidity", "heat_duration"
        ]
        
        return np.array(features, dtype=np.float32)
    
    def train(self, scenarios: List[Dict], resources_deployed: List[Dict]) -> Dict:
        """Train the model on historical scenarios"""
        if not SKLEARN_AVAILABLE:
            return {"status": "sklearn not available", "accuracy": 0.0}
        
        if len(scenarios) < 10:
            print("Warning: Not enough training data. Using fallback logic.")
            return {"status": "insufficient_data", "accuracy": 0.0}
        
        # Prepare features and targets
        X = []
        y_medical = []
        y_food = []
        y_water = []
        y_shelter = []
        
        for scenario, resources in zip(scenarios, resources_deployed):
            features = self._extract_features(scenario)
            X.append(features)
            
            # Extract target values
            y_medical.append(resources.get("medical_kits", 0))
            y_food.append(resources.get("food_packets", 0))
            y_water.append(resources.get("water_liters", 0))
            y_shelter.append(resources.get("shelter_kits", 0))
        
        X = np.array(X)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train separate models for each resource type
        results = {}
        
        for resource_name, y in [("medical_kits", y_medical), ("food_packets", y_food), 
                                 ("water_liters", y_water), ("shelter_kits", y_shelter)]:
            if len(set(y)) < 2:  # Need at least 2 unique values
                continue
                
            y = np.array(y)
            
            # Split data
            if len(X) > 5:
                X_train, X_test, y_train, y_test = train_test_split(
                    X_scaled, y, test_size=0.2, random_state=42
                )
            else:
                X_train, X_test, y_train, y_test = X_scaled, X_scaled, y, y
            
            # Train LightGBM model with improved hyperparameters
            train_data = lgb.Dataset(X_train, label=y_train)
            valid_data = lgb.Dataset(X_test, label=y_test, reference=train_data)
            
            params = {
                'objective': 'regression',
                'metric': 'rmse',
                'boosting_type': 'gbdt',
                'num_leaves': 63,  # Increased for better fit
                'max_depth': 8,  # Added depth control
                'learning_rate': 0.03,  # Lower learning rate
                'feature_fraction': 0.85,
                'bagging_fraction': 0.85,
                'bagging_freq': 3,
                'min_data_in_leaf': 5,  # Prevent overfitting
                'lambda_l1': 0.1,  # L1 regularization
                'lambda_l2': 0.1,  # L2 regularization
                'verbose': -1,
                'seed': 42
            }
            
            model = lgb.train(
                params,
                train_data,
                num_boost_round=500,  # More boosting rounds
                valid_sets=[valid_data],
                callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
            )
            
            # Evaluate
            y_pred = model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            # Store model
            setattr(self, f"{resource_name}_model", model)
            
            results[resource_name] = {
                "mae": float(mae),
                "r2": float(r2),
                "feature_importance": dict(zip(
                    self.feature_names,
                    model.feature_importance(importance_type='gain').tolist()
                ))
            }
        
        self.is_trained = True
        return results
    
    def predict(self, scenario: Dict) -> Dict:
        """Predict resource demand for a scenario"""
        if not self.is_trained or not SKLEARN_AVAILABLE:
            # Fallback to rule-based prediction
            return self._fallback_predict(scenario)
        
        features = self._extract_features(scenario)
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        
        predictions = {}
        
        for resource_name in ["medical_kits", "food_packets", "water_liters", "shelter_kits"]:
            model = getattr(self, f"{resource_name}_model", None)
            if model:
                pred = model.predict(features_scaled)[0]
                predictions[resource_name] = max(0, int(pred))
            else:
                # Fallback for untrained resources
                predictions[resource_name] = self._fallback_predict(scenario).get(
                    f"{resource_name}_required", 0
                )
        
        return {
            "medical_kits_required": predictions.get("medical_kits", 0),
            "food_packets_required": predictions.get("food_packets", 0),
            "water_liters_required": predictions.get("water_liters", 0),
            "shelter_kits_required": predictions.get("shelter_kits", 0),
        }
    
    def _fallback_predict(self, scenario: Dict) -> Dict:
        """Fallback rule-based prediction"""
        severity = scenario.get("severity_level", scenario.get("severity", 3))
        population = scenario.get("population_affected", 10000)
        
        return {
            "medical_kits_required": max(100, int(population * 0.15 * (severity / 3.0))),
            "food_packets_required": population // 10,
            "water_liters_required": population * 3,
            "shelter_kits_required": population // 100,
        }
    
    def get_feature_importance(self) -> Dict:
        """Get feature importance for interpretability"""
        if not self.is_trained:
            return {}
        
        importance = {}
        for resource_name in ["medical_kits", "food_packets", "water_liters", "shelter_kits"]:
            model = getattr(self, f"{resource_name}_model", None)
            if model:
                importance[resource_name] = dict(zip(
                    self.feature_names,
                    model.feature_importance(importance_type='gain').tolist()
                ))
        
        return importance
    
    def save(self, filepath: str):
        """Save trained model"""
        if not self.is_trained:
            return
        
        model_data = {
            "scaler": self.scaler,
            "feature_names": self.feature_names,
            "is_trained": self.is_trained
        }
        
        # Save models
        for resource_name in ["medical_kits", "food_packets", "water_liters", "shelter_kits"]:
            model = getattr(self, f"{resource_name}_model", None)
            if model:
                model.save_model(os.path.join(filepath, f"{resource_name}_model.txt"))
        
        # Save scaler and metadata
        with open(os.path.join(filepath, "model_metadata.pkl"), "wb") as f:
            pickle.dump(model_data, f)
    
    def load(self, filepath: str):
        """Load trained model"""
        try:
            with open(os.path.join(filepath, "model_metadata.pkl"), "rb") as f:
                model_data = pickle.load(f)
            
            self.scaler = model_data["scaler"]
            self.feature_names = model_data["feature_names"]
            
            # Load models
            for resource_name in ["medical_kits", "food_packets", "water_liters", "shelter_kits"]:
                model_path = os.path.join(filepath, f"{resource_name}_model.txt")
                if os.path.exists(model_path):
                    model = lgb.Booster(model_file=model_path)
                    setattr(self, f"{resource_name}_model", model)
            
            self.is_trained = True
        except Exception as e:
            print(f"Error loading model: {e}")
            self.is_trained = False


class ScenarioClassifier:
    """TF-IDF + Logistic Regression for scenario classification"""
    
    def __init__(self):
        self.vectorizer = None
        self.model = None
        self.is_trained = False
        
    def _extract_text_features(self, scenario: Dict) -> str:
        """Extract text features from scenario for TF-IDF"""
        disaster_type = scenario.get("disaster_type", "")
        notes = scenario.get("notes", "")
        zones = " ".join(scenario.get("zones_impacted", scenario.get("zones_affected", [])))
        blocked_roads = " ".join(scenario.get("blocked_roads", []))
        
        # Combine text features
        text = f"{disaster_type} {notes} {zones} {blocked_roads}".lower()
        return text
    
    def _extract_numerical_features(self, scenario: Dict) -> List[float]:
        """Extract comprehensive numerical features for classification"""
        severity = scenario.get("severity_level", scenario.get("severity", 3))
        population = scenario.get("population_affected", 10000)
        hospital_load = scenario.get("hospital_load_pct", scenario.get("hospital_load", 50))
        if hospital_load <= 1:
            hospital_load = hospital_load * 100
        zones_count = len(scenario.get("zones_impacted", scenario.get("zones_affected", [])))
        blocked_count = len(scenario.get("blocked_roads", []))
        
        # Disaster type encoding
        disaster_type = scenario.get("disaster_type", "flood")
        is_flood = 1.0 if disaster_type == "flood" else 0.0
        is_cyclone = 1.0 if disaster_type == "cyclone" else 0.0
        is_earthquake = 1.0 if disaster_type == "earthquake" else 0.0
        is_heatwave = 1.0 if disaster_type == "heatwave" else 0.0
        
        # Composite risk score (helps classification)
        risk_score = (
            severity * 0.4 + 
            (hospital_load / 100) * 0.3 + 
            (min(zones_count, 5) / 5) * 0.15 +
            (min(blocked_count, 5) / 5) * 0.15
        )
        
        return [
            severity / 5.0, 
            severity ** 2 / 25.0,  # Squared for non-linearity
            np.log1p(population) / 15.0, 
            hospital_load / 100.0,
            zones_count / 5.0, 
            blocked_count / 5.0,
            is_flood, is_cyclone, is_earthquake, is_heatwave,
            risk_score
        ]
    
    def train(self, scenarios: List[Dict], risk_levels: List[str]) -> Dict:
        """Train classifier on scenarios using hybrid features"""
        if not SKLEARN_AVAILABLE:
            return {"status": "sklearn not available", "accuracy": 0.0}
        
        if len(scenarios) < 5:
            return {"status": "insufficient_data", "accuracy": 0.0}
        
        # Extract text features
        texts = [self._extract_text_features(s) for s in scenarios]
        
        # Vectorize text
        self.vectorizer = TfidfVectorizer(max_features=20, stop_words='english')
        X_text = self.vectorizer.fit_transform(texts).toarray()
        
        # Extract numerical features
        X_num = np.array([self._extract_numerical_features(s) for s in scenarios])
        
        # Combine features - give more weight to numerical features
        X = np.hstack([X_num, X_text * 0.5])  # Reduce text feature influence
        
        # Store feature count
        self.num_features_count = X_num.shape[1]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, risk_levels, test_size=0.15, random_state=42, stratify=risk_levels
        )
        
        # Train classifier with optimized parameters
        self.model = LogisticRegression(
            max_iter=3000, 
            random_state=42,
            C=2.0,  # Slightly higher regularization
            class_weight='balanced',
            solver='lbfgs'
        )
        self.model.fit(X_train, y_train)
        
        # Evaluate on test set
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Also get training accuracy
        y_train_pred = self.model.predict(X_train)
        train_accuracy = accuracy_score(y_train, y_train_pred)
        
        self.is_trained = True
        
        return {
            "status": "trained",
            "accuracy": float(accuracy),
            "train_accuracy": float(train_accuracy),
            "feature_names": ["severity", "severity_sq", "population", "hospital_load", "zones", "blocked_roads", 
                             "is_flood", "is_cyclone", "is_earthquake", "is_heatwave", "risk_score"] + 
                            list(self.vectorizer.get_feature_names_out())
        }
    
    def predict_risk_level(self, scenario: Dict) -> str:
        """Predict risk level from scenario"""
        if not self.is_trained or not SKLEARN_AVAILABLE:
            # Fallback to rule-based
            severity = scenario.get("severity_level", scenario.get("severity", 3))
            if severity >= 5:
                return "CRITICAL"
            elif severity >= 4:
                return "HIGH"
            elif severity >= 3:
                return "MODERATE"
            else:
                return "LOW"
        
        # Extract text features
        text = self._extract_text_features(scenario)
        X_text = self.vectorizer.transform([text]).toarray()
        
        # Extract numerical features
        X_num = np.array([self._extract_numerical_features(scenario)])
        
        # Combine features (same order as training)
        X = np.hstack([X_num, X_text * 0.5])
        
        prediction = self.model.predict(X)[0]
        
        return prediction
    
    def get_feature_importance(self) -> Dict:
        """Get feature importance (TF-IDF weights)"""
        if not self.is_trained:
            return {}
        
        # Get coefficients for each class
        feature_names = self.vectorizer.get_feature_names_out()
        importance = {}
        
        for i, class_name in enumerate(self.model.classes_):
            coef = self.model.coef_[i]
            top_features = sorted(
                zip(feature_names, coef),
                key=lambda x: abs(x[1]),
                reverse=True
            )[:10]
            importance[class_name] = {name: float(weight) for name, weight in top_features}
        
        return importance


def load_training_data() -> Tuple[List[Dict], List[Dict], List[str]]:
    """Load historical scenarios for training"""
    scenarios = []
    resources_list = []
    risk_levels = []
    
    data_dir = os.path.join(os.path.dirname(__file__), 'data', 'scenarios')
    
    if os.path.exists(data_dir):
        for filename in os.listdir(data_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(data_dir, filename), 'r') as f:
                        scenario = json.load(f)
                        scenarios.append(scenario)
                        
                        # Extract resources deployed
                        resources = scenario.get("resources_deployed", {})
                        resources_list.append(resources)
                        
                        # Extract risk level (infer from severity)
                        severity = scenario.get("severity_level", scenario.get("severity", 3))
                        if severity >= 5:
                            risk_levels.append("CRITICAL")
                        elif severity >= 4:
                            risk_levels.append("HIGH")
                        elif severity >= 3:
                            risk_levels.append("MODERATE")
                        else:
                            risk_levels.append("LOW")
                except Exception as e:
                    print(f"Error loading {filename}: {e}")
    
    return scenarios, resources_list, risk_levels


def train_models() -> Dict:
    """Train all ML models"""
    print("Loading training data...")
    scenarios, resources_list, risk_levels = load_training_data()
    
    if len(scenarios) < 5:
        print("Not enough training data. Models will use fallback logic.")
        return {"status": "insufficient_data"}
    
    results = {}
    
    # Train demand prediction model
    print("Training demand prediction model (LightGBM)...")
    demand_model = DemandPredictionModel()
    demand_results = demand_model.train(scenarios, resources_list)
    results["demand_model"] = demand_results
    
    # Train risk classifier
    print("Training risk classifier (TF-IDF + LR)...")
    classifier = ScenarioClassifier()
    classifier_results = classifier.train(scenarios, risk_levels)
    results["classifier"] = classifier_results
    
    # Save models
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(model_dir, exist_ok=True)
    
    demand_model.save(model_dir)
    
    # Save classifier
    classifier_path = os.path.join(model_dir, 'classifier.pkl')
    with open(classifier_path, 'wb') as f:
        pickle.dump({
            'vectorizer': classifier.vectorizer,
            'model': classifier.model,
            'num_features_count': classifier.num_features_count
        }, f)
    
    print(f"Training complete. Demand model R²: {demand_results.get('medical_kits', {}).get('r2', 0):.3f}")
    print(f"Classifier accuracy: {classifier_results.get('accuracy', 0):.3f}")
    
    return results

