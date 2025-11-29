"""
ReliefRoute Agentic AI Core
Enhanced with disaster-specific logic and improved similarity matching
"""
import math
import uuid
import json
import os
from datetime import datetime
from typing import List, Dict, Optional
import random

from .scenarios import CHENNAI_SCENARIOS, DEPOT_INVENTORY, ZONES
from .routing import find_routes_to_zones, a_star_route, find_alternative_route
from .models import ScenarioInput, ScenarioRequest, DecisionResponse
from .ml_models import DemandPredictionModel, ScenarioClassifier, train_models

class ReliefRouteAgent:
    """Autonomous disaster relief decision-making agent"""
    
    def __init__(self):
        self.decisions_history = []
        self.learning_weights = {
            "medical": 1.0,
            "evacuation": 1.0,
            "infrastructure": 1.0
        }
        self.historical_scenarios = self._load_historical_scenarios()
        
        # Initialize ML models
        self.demand_model = DemandPredictionModel()
        self.risk_classifier = ScenarioClassifier()
        self.ml_models_loaded = False
        self._load_ml_models()
        
    def _load_historical_scenarios(self) -> List[Dict]:
        """Load historical scenarios from JSON files or fallback to hardcoded"""
        scenarios = []
        data_dir = os.path.join(os.path.dirname(__file__), 'data', 'scenarios')
        
        if os.path.exists(data_dir):
            for filename in os.listdir(data_dir):
                if filename.endswith('.json'):
                    try:
                        with open(os.path.join(data_dir, filename), 'r') as f:
                            scenario = json.load(f)
                            scenarios.append(scenario)
                    except Exception as e:
                        print(f"Error loading {filename}: {e}")
        
        # If no JSON files found, use hardcoded scenarios
        if not scenarios:
            scenarios = CHENNAI_SCENARIOS
            
        return scenarios
    
    def _load_ml_models(self):
        """Load pre-trained ML models (no training on startup)"""
        try:
            model_dir = os.path.join(os.path.dirname(__file__), 'models')
            if os.path.exists(model_dir) and os.path.exists(os.path.join(model_dir, 'model_metadata.pkl')):
                self.demand_model.load(model_dir)
                self.ml_models_loaded = self.demand_model.is_trained
                
                # Load risk classifier if saved
                classifier_path = os.path.join(model_dir, 'classifier.pkl')
                if os.path.exists(classifier_path):
                    import pickle
                    with open(classifier_path, 'rb') as f:
                        classifier_data = pickle.load(f)
                    self.risk_classifier.vectorizer = classifier_data.get('vectorizer')
                    self.risk_classifier.model = classifier_data.get('model')
                    self.risk_classifier.num_features_count = classifier_data.get('num_features_count', 5)
                    self.risk_classifier.is_trained = True
                
                if self.ml_models_loaded:
                    print("✅ ML models loaded successfully (pre-trained)")
                    print(f"   Demand prediction: {'Ready' if self.demand_model.is_trained else 'Fallback'}")
                    print(f"   Risk classifier: {'Ready' if self.risk_classifier.is_trained else 'Fallback'}")
            else:
                print("⚠️  No pre-trained models found. Run 'python train_models.py' to train.")
                print("   Using rule-based fallback logic.")
                self.ml_models_loaded = False
        except Exception as e:
            print(f"⚠️  Could not load ML models: {e}")
            print("   Using rule-based fallback logic.")
            self.ml_models_loaded = False
        
    def calculate_scenario_similarity(self, current: Dict, historical: Dict) -> float:
        """Calculate similarity score between scenarios using weighted distance metric"""
        weights = {
            "severity": 2.0,
            "population": 1.5,
            "hospital_load": 1.8,
            "zones_count": 1.0,
            "blocked_roads_count": 1.2
        }
        
        # Get severity - handle both old and new field names (ensure int type)
        current_severity = int(current.get("severity_level", current.get("severity", 3)))
        historical_severity = int(historical.get("severity_level", historical.get("severity", 3)))
        
        # Get population (ensure int type)
        current_pop = int(current.get("population_affected", 10000))
        historical_pop = int(historical.get("population_affected", 10000))
        
        # Get hospital load - handle both percentage and decimal formats (ensure float type)
        current_hospital = float(current.get("hospital_load_pct", current.get("hospital_load", 50)))
        historical_hospital = float(historical.get("hospital_load_pct", historical.get("hospital_load", 0.5)))
        
        # Normalize hospital load to 0-1 scale
        if current_hospital > 1:
            current_hospital = current_hospital / 100.0
        if historical_hospital > 1:
            historical_hospital = historical_hospital / 100.0
            
        # Get zones - handle both old and new field names
        current_zones = current.get("zones_impacted", current.get("zones_affected", []))
        historical_zones = historical.get("zones_impacted", historical.get("zones_affected", []))
        
        # Normalize values for comparison
        severity_diff = abs(current_severity - historical_severity) / 5.0
        pop_diff = abs(current_pop - historical_pop) / 100000.0
        hospital_diff = abs(current_hospital - historical_hospital)
        zones_diff = abs(len(current_zones) - len(historical_zones)) / 5.0
        blocked_diff = abs(len(current.get("blocked_roads", [])) - len(historical.get("blocked_roads", []))) / 5.0
        
        # Add disaster-specific similarity if same type
        disaster_specific_penalty = 0
        if current.get("disaster_type") == historical.get("disaster_type"):
            disaster_specific = current.get("disaster_specific", {})
            hist_specific = historical.get("disaster_specific", {})
            
            disaster_type = current.get("disaster_type")
            
            if disaster_type == "flood":
                curr_flood = disaster_specific.get("flood", {}) if disaster_specific else {}
                hist_flood = hist_specific.get("flood", {}) if hist_specific else {}
                
                # Compare water level
                curr_water = curr_flood.get("water_level_m", historical.get("flood_depth_m", 0.5))
                hist_water = hist_flood.get("water_level_m", historical.get("flood_depth_m", 0.5))
                disaster_specific_penalty += abs(curr_water - hist_water) * 0.3
                
            elif disaster_type == "cyclone":
                curr_cyclone = disaster_specific.get("cyclone", {}) if disaster_specific else {}
                hist_cyclone = hist_specific.get("cyclone", {}) if hist_specific else {}
                
                curr_wind = curr_cyclone.get("max_wind_speed_kmph", historical.get("wind_speed_kmh", 100))
                hist_wind = hist_cyclone.get("max_wind_speed_kmph", historical.get("wind_speed_kmh", 100))
                disaster_specific_penalty += abs(curr_wind - hist_wind) / 200.0 * 0.3
                
            elif disaster_type == "heatwave":
                curr_heat = disaster_specific.get("heatwave", {}) if disaster_specific else {}
                hist_heat = hist_specific.get("heatwave", {}) if hist_specific else {}
                
                curr_temp = curr_heat.get("max_temp_c", historical.get("temperature_c", 45))
                hist_temp = hist_heat.get("max_temp_c", historical.get("temperature_c", 45))
                disaster_specific_penalty += abs(curr_temp - hist_temp) / 20.0 * 0.3
        
        distance = math.sqrt(
            weights["severity"] * severity_diff ** 2 +
            weights["population"] * pop_diff ** 2 +
            weights["hospital_load"] * hospital_diff ** 2 +
            weights["zones_count"] * zones_diff ** 2 +
            weights["blocked_roads_count"] * blocked_diff ** 2
        ) + disaster_specific_penalty
        
        return distance
    
    def find_similar_scenarios(self, scenario: Dict, top_k: int = 3) -> List[Dict]:
        """Find most similar historical scenarios"""
        all_scenarios = self.historical_scenarios if self.historical_scenarios else CHENNAI_SCENARIOS
        
        # Filter by disaster type first
        disaster_type = scenario.get("disaster_type")
        same_type = [s for s in all_scenarios if s.get("disaster_type") == disaster_type]
        
        if not same_type:
            same_type = all_scenarios  # Fall back to all scenarios
        
        similarities = []
        for hist in same_type:
            dist = self.calculate_scenario_similarity(scenario, hist)
            similarities.append({
                "scenario": hist,
                "distance": round(dist, 3)
            })
        
        similarities.sort(key=lambda x: x["distance"])
        return similarities[:top_k]
    
    def estimate_resources(self, scenario: Dict, similar_scenarios: List[Dict]) -> Dict:
        """Estimate required resources using ML models with rule-based fallback"""
        # Try ML model prediction first
        if self.ml_models_loaded:
            try:
                ml_prediction = self.demand_model.predict(scenario)
                # Use ML prediction as base, then adjust with similar scenarios
                base_prediction = ml_prediction
            except Exception as e:
                print(f"ML prediction failed: {e}. Using rule-based fallback.")
                base_prediction = None
        else:
            base_prediction = None
        
        # Rule-based fallback or hybrid approach
        severity = scenario.get("severity_level", scenario.get("severity", 3))
        population = scenario.get("population_affected", 10000)
        hospital_load = scenario.get("hospital_load_pct", scenario.get("hospital_load", 50))
        
        # Normalize hospital load
        if hospital_load > 1:
            hospital_load = hospital_load / 100.0
            
        zones = scenario.get("zones_impacted", scenario.get("zones_affected", []))
        num_zones = len(zones)
        disaster_type = scenario.get("disaster_type", "flood")
        
        # Get available resources from input
        available = scenario.get("available_resources", {})
        
        # Base calculations using humanitarian heuristics
        people_needing_care = int(population * 0.10 * (hospital_load / 0.5))
        medical_kits_needed = max(100, people_needing_care // 10)
        
        # If ML model provided prediction, blend with rule-based
        if base_prediction:
            # Weighted average: 70% ML, 30% rule-based
            medical_kits_needed = int(
                0.7 * base_prediction.get("medical_kits_required", medical_kits_needed) +
                0.3 * medical_kits_needed
            )
        
        # Adjust based on similar scenarios
        if similar_scenarios:
            avg_kits = sum(s["scenario"].get("resources_deployed", {}).get("medical_kits", 0) 
                         for s in similar_scenarios) / len(similar_scenarios)
            if avg_kits > 0:
                # Final blend: 50% current estimate, 50% historical average
                medical_kits_needed = int((medical_kits_needed + avg_kits) / 2)
        
        # Vehicle requirements based on disaster type
        boats_needed = 0
        drones_needed = 0
        trucks_needed = max(2, num_zones * 2)
        helicopters_needed = 0
        
        if disaster_type in ["flood", "cyclone"]:
            boats_needed = max(1, severity - 1) * num_zones
            
            # Check disaster-specific data for flood
            disaster_specific = scenario.get("disaster_specific", {})
            if disaster_specific and disaster_specific.get("flood"):
                flood_data = disaster_specific["flood"]
                water_level = flood_data.get("water_level_m", 0.5)
                if water_level > 1.0:
                    boats_needed += 2
                if water_level > 1.5:
                    helicopters_needed = 1
                    
            if severity >= 4:
                helicopters_needed = max(helicopters_needed, 1)
            if severity >= 5:
                helicopters_needed = max(helicopters_needed, 2)
        
        elif disaster_type == "earthquake":
            # Earthquakes need more trucks and drones for search
            trucks_needed = max(4, num_zones * 3)
            drones_needed = max(2, num_zones * 2)
            
            disaster_specific = scenario.get("disaster_specific", {})
            if disaster_specific and disaster_specific.get("earthquake"):
                eq_data = disaster_specific["earthquake"]
                collapse_ratio = eq_data.get("building_collapse_ratio", 0.1)
                if collapse_ratio > 0.2:
                    helicopters_needed = 1
                if collapse_ratio > 0.3:
                    helicopters_needed = 2
                    
        elif disaster_type == "heatwave":
            # Heatwaves need more trucks for water distribution
            trucks_needed = max(3, num_zones * 2)
            drones_needed = max(1, num_zones)
        
        drones_needed = max(1, num_zones)
        
        # Food and water calculations - use ML if available
        if base_prediction:
            food_packets = int(
                0.7 * base_prediction.get("food_packets_required", population // 10) +
                0.3 * (population // 10)
            )
            water_liters = int(
                0.7 * base_prediction.get("water_liters_required", population * 3) +
                0.3 * (population * 3)
            )
            shelter_kits = int(
                0.7 * base_prediction.get("shelter_kits_required", population // 100) +
                0.3 * (population // 100)
            )
        else:
            food_packets = population // 10
            water_liters = population * 3  # 3 liters per person per day
            shelter_kits = population // 100
        
        return {
            "medical_kits_required": medical_kits_needed,
            "food_packets_required": food_packets,
            "water_liters_required": water_liters,
            "shelter_kits_required": shelter_kits,
            "boats_required": boats_needed,
            "drones_required": drones_needed,
            "trucks_required": trucks_needed,
            "helicopters_required": helicopters_needed,
            "prediction_method": "ml_hybrid" if base_prediction else "rule_based"
        }
    
    def check_inventory(self, required: Dict, available_resources: Dict = None) -> Dict:
        """Check available inventory against requirements"""
        total_available = {
            "medical_kits": 0,
            "food_packets": 0,
            "water_liters": 0,
            "shelter_kits": 0,
            "boats": 0,
            "drones": 0,
            "trucks": 0,
            "helicopters": 0
        }
        
        # Add depot inventory
        for depot_id, depot in DEPOT_INVENTORY.items():
            for resource, amount in depot["resources"].items():
                if resource in total_available:
                    total_available[resource] += amount
            for vehicle, count in depot["vehicles"].items():
                if vehicle in total_available:
                    total_available[vehicle] += count
        
        # Add user-specified available resources if provided
        if available_resources:
            total_available["medical_kits"] = max(total_available["medical_kits"], 
                                                   available_resources.get("medical_kits_available", 0))
            total_available["boats"] = max(total_available["boats"], 
                                           available_resources.get("boats_available", 0))
            total_available["drones"] = max(total_available["drones"], 
                                            available_resources.get("drones_available", 0))
            total_available["trucks"] = max(total_available["trucks"], 
                                            available_resources.get("trucks_available", 0))
        
        gaps = {}
        for resource, required_amount in required.items():
            # Skip non-numeric fields like 'prediction_method'
            if not isinstance(required_amount, (int, float)):
                continue
            resource_key = resource.replace("_required", "")
            available = total_available.get(resource_key, 0)
            gap = max(0, int(required_amount) - int(available))
            gaps[resource_key] = {
                "required": int(required_amount),
                "available": int(available),
                "gap": gap
            }
        
        return gaps
    
    def generate_weather_snapshot(self, scenario: Dict) -> Dict:
        """Generate weather data based on disaster type and specific inputs"""
        disaster_type = scenario.get("disaster_type", "flood")
        severity = scenario.get("severity_level", scenario.get("severity", 3))
        disaster_specific = scenario.get("disaster_specific", {})
        
        if disaster_type == "flood":
            flood_data = disaster_specific.get("flood", {}) if disaster_specific else {}
            return {
                "rainfall_24h_mm": flood_data.get("rainfall_mm_24h", 150 + severity * 50 + random.randint(-20, 30)),
                "wind_speed_kmh": 30 + severity * 10 + random.randint(-5, 15),
                "flood_depth_m": flood_data.get("water_level_m", round(0.3 + severity * 0.3 + random.uniform(-0.1, 0.2), 1)),
                "humidity_percent": 85 + random.randint(-5, 10),
                "type": flood_data.get("inland_or_coastal", "inland")
            }
        elif disaster_type == "cyclone":
            cyclone_data = disaster_specific.get("cyclone", {}) if disaster_specific else {}
            return {
                "rainfall_24h_mm": 100 + severity * 40 + random.randint(-20, 30),
                "wind_speed_kmh": cyclone_data.get("max_wind_speed_kmph", 80 + severity * 25 + random.randint(-10, 20)),
                "translation_speed_kmh": cyclone_data.get("cyclone_translation_speed_kmph", 15 + random.randint(0, 10)),
                "direction": cyclone_data.get("cyclone_direction", "NE"),
                "flood_depth_m": round(0.2 + severity * 0.2 + random.uniform(-0.1, 0.1), 1),
                "storm_surge_m": round(0.5 + severity * 0.3, 1)
            }
        elif disaster_type == "earthquake":
            eq_data = disaster_specific.get("earthquake", {}) if disaster_specific else {}
            return {
                "magnitude": eq_data.get("magnitude", 4.0 + severity * 0.8),
                "epicenter_distance_km": eq_data.get("epicenter_distance_km", 100 - severity * 15),
                "aftershock_risk": "High" if severity >= 4 else "Moderate" if severity >= 2 else "Low",
                "building_collapse_ratio": eq_data.get("building_collapse_ratio", severity * 0.05)
            }
        elif disaster_type == "heatwave":
            heat_data = disaster_specific.get("heatwave", {}) if disaster_specific else {}
            return {
                "temperature_c": heat_data.get("max_temp_c", 40 + severity * 2 + random.randint(-1, 2)),
                "humidity_percent": heat_data.get("humidity_pct", 35 - severity * 3 + random.randint(-5, 5)),
                "duration_days": heat_data.get("duration_days", severity + random.randint(0, 2)),
                "heat_index": 45 + severity * 3
            }
        else:
            return {
                "conditions": "Monitoring active",
                "severity_index": severity
            }
    
    def determine_risk_level(self, scenario: Dict, inventory_status: Dict) -> str:
        """Determine overall risk level using ML classifier with rule-based fallback"""
        # Try ML classifier first
        if self.ml_models_loaded and self.risk_classifier.is_trained:
            try:
                ml_risk = self.risk_classifier.predict_risk_level(scenario)
                # Use ML prediction as primary, but validate with rules
            except Exception as e:
                print(f"ML risk classification failed: {e}")
                ml_risk = None
        else:
            ml_risk = None
        
        # Rule-based risk determination
        severity = scenario.get("severity_level", scenario.get("severity", 3))
        hospital_load = scenario.get("hospital_load_pct", scenario.get("hospital_load", 50))
        
        # Normalize hospital load
        if hospital_load <= 1:
            hospital_load = hospital_load * 100
            
        # Check for supply gaps
        has_critical_gap = any(
            item["gap"] > 0 and item["gap"] > item["available"] * 0.3
            for item in inventory_status.values()
        )
        
        if severity >= 5 or hospital_load >= 90 or has_critical_gap:
            return "CRITICAL"
        elif severity >= 4 or hospital_load >= 75:
            return "HIGH"
        elif severity >= 3 or hospital_load >= 50:
            return "MODERATE"
        else:
            return "LOW"
    
    def generate_recommended_actions(self, scenario: Dict, routes: Dict, 
                                    resource_estimates: Dict, inventory_status: Dict) -> List[str]:
        """Generate list of recommended actions"""
        actions = []
        disaster_type = scenario.get("disaster_type", "flood")
        zones = scenario.get("zones_impacted", scenario.get("zones_affected", []))
        blocked = scenario.get("blocked_roads", [])
        hospital_load = scenario.get("hospital_load_pct", scenario.get("hospital_load", 50))
        
        # Normalize hospital load
        if hospital_load <= 1:
            hospital_load = hospital_load * 100
        
        # Medical deployment
        medical_gap = inventory_status.get("medical_kits", {}).get("gap", 0)
        if medical_gap == 0:
            actions.append(f"Deploy {resource_estimates['medical_kits_required']} medical kits to affected zones.")
        else:
            actions.append(f"ALERT: Medical kit shortage of {medical_gap} units. Requesting emergency resupply.")
        
        # Vehicle deployment based on disaster type
        if disaster_type in ["flood", "cyclone"]:
            boats = resource_estimates["boats_required"]
            if boats > 0:
                actions.append(f"Deploy rescue boats to flooded / cut-off zones. -> Resource: boats x {boats} -> Zones: {', '.join(zones)}")
        
        if disaster_type == "earthquake":
            drones = resource_estimates["drones_required"]
            actions.append(f"Deploy search & rescue drones for structural damage assessment. -> Resource: drones x {drones} -> Zones: {', '.join(zones)}")
            actions.append(f"Activate urban search and rescue (USAR) teams for building collapse zones.")
        
        drones = resource_estimates["drones_required"]
        if drones > 0 and disaster_type not in ["earthquake"]:
            actions.append(f"Use drones to deliver critical supplies to inaccessible areas. -> Resource: drones x {drones} -> Zones: {', '.join(zones)}")
        
        trucks = resource_estimates["trucks_required"]
        actions.append(f"Dispatch ground convoy with supplies. -> Resource: trucks x {trucks}")
        
        # Handle blocked roads
        if blocked:
            actions.append(f"Reroute ground vehicles to avoid blocked roads: {', '.join(blocked)} -> Zones: {', '.join(zones)}")
        
        # Hospital surge support
        if hospital_load >= 70:
            actions.append(f"Trigger hospital surge support protocol. ICU load at {hospital_load:.0f}%")
        
        # Disaster-specific actions
        disaster_specific = scenario.get("disaster_specific", {})
        
        if disaster_type == "flood" and disaster_specific:
            flood_data = disaster_specific.get("flood", {})
            water_level = flood_data.get("water_level_m", 0)
            if water_level > 1.0:
                actions.append(f"CRITICAL: Water level at {water_level}m - Initiate elevated evacuation procedures.")
            if flood_data.get("inland_or_coastal") == "coastal":
                actions.append("Monitor for tidal surge impact on coastal communities.")
                
        if disaster_type == "cyclone" and disaster_specific:
            cyclone_data = disaster_specific.get("cyclone", {})
            wind_speed = cyclone_data.get("max_wind_speed_kmph", 0)
            if wind_speed > 150:
                actions.append(f"SEVERE: Wind speeds at {wind_speed} km/h - Halt all aerial operations.")
            actions.append(f"Track cyclone movement ({cyclone_data.get('cyclone_direction', 'NE')}) and pre-position resources.")
            
        if disaster_type == "heatwave" and disaster_specific:
            heat_data = disaster_specific.get("heatwave", {})
            temp = heat_data.get("max_temp_c", 0)
            if temp > 45:
                actions.append(f"EXTREME HEAT: {temp}°C - Deploy cooling centers and water stations.")
            actions.append("Distribute ORS packets and cooling supplies to vulnerable populations.")
            
        if disaster_type == "earthquake" and disaster_specific:
            eq_data = disaster_specific.get("earthquake", {})
            magnitude = eq_data.get("magnitude", 0)
            if magnitude > 6.0:
                actions.append(f"MAJOR EARTHQUAKE: M{magnitude} - Activate full emergency response.")
            actions.append("Establish field triage centers near collapsed structures.")
        
        # Helicopter for severe cases
        helicopters = resource_estimates.get("helicopters_required", 0)
        if helicopters > 0:
            actions.append(f"Dispatch helicopter for emergency evacuation. -> Resource: helicopters x {helicopters}")
        
        # Pre-positioning recommendation
        severity = scenario.get("severity_level", scenario.get("severity", 3))
        if severity >= 3:
            actions.append("Pre-position additional supplies at nearest operational depot for rapid redeployment.")
        
        return actions
    
    def run_from_input(self, input_data: ScenarioInput) -> DecisionResponse:
        """Run agent with new ScenarioInput format"""
        scenario = {
            "city": input_data.city,
            "disaster_type": input_data.disaster_type,
            "severity_level": input_data.severity_level,
            "severity_label": input_data.severity_label,
            "population_affected": input_data.population_affected,
            "zones_impacted": input_data.zones_impacted,
            "hospital_load_pct": input_data.hospital_load_pct,
            "blocked_roads": input_data.blocked_roads,
            "available_resources": input_data.available_resources.dict() if input_data.available_resources else {},
            "disaster_specific": input_data.disaster_specific.dict() if input_data.disaster_specific else {},
            "notes": input_data.notes
        }
        
        return self._process_scenario(scenario)
    
    def run(self, request: ScenarioRequest) -> DecisionResponse:
        """Main agent execution - process legacy scenario format"""
        scenario = {
            "disaster_type": request.disaster_type,
            "severity_level": request.severity,
            "population_affected": request.population_affected,
            "zones_impacted": request.zones_affected,
            "hospital_load_pct": request.hospital_load if request.hospital_load > 1 else request.hospital_load * 100,
            "blocked_roads": request.blocked_roads
        }
        
        return self._process_scenario(scenario)
    
    def _process_scenario(self, scenario: Dict) -> DecisionResponse:
        """Internal method to process scenario and generate decision"""
        
        # Step 1: Find similar historical scenarios
        similar = self.find_similar_scenarios(scenario)
        similar_scenarios_info = [
            {
                "id": s["scenario"]["id"],
                "distance": s["distance"],
                "severity": s["scenario"].get("severity_level", s["scenario"].get("severity", 0)),
                "hospital_load": s["scenario"].get("hospital_load_pct", s["scenario"].get("hospital_load", 0)),
                "outcome": s["scenario"].get("outcome", "unknown")
            }
            for s in similar
        ]
        
        # Step 2: Estimate resource requirements
        resource_estimates = self.estimate_resources(scenario, similar)
        
        # Step 3: Check inventory
        available_resources = scenario.get("available_resources", {})
        inventory_status = self.check_inventory(resource_estimates, available_resources)
        
        # Step 4: Calculate routes
        zones = scenario.get("zones_impacted", scenario.get("zones_affected", []))
        blocked_roads = scenario.get("blocked_roads", [])
        routes = find_routes_to_zones("Central_Depot", zones, blocked_roads)
        
        # Find best route (to first zone)
        primary_zone = zones[0] if zones else "Central"
        primary_route = routes.get(primary_zone)
        
        # Get primary route coordinates for map polyline
        primary_route_coords = None
        if primary_route and primary_route.get("path_coordinates"):
            primary_route_coords = primary_route["path_coordinates"]
        
        # Step 5: Generate weather snapshot
        weather = self.generate_weather_snapshot(scenario)
        
        # Step 6: Determine risk level
        risk_level = self.determine_risk_level(scenario, inventory_status)
        
        # Step 7: Generate recommended actions
        recommended_actions = self.generate_recommended_actions(
            scenario, routes, resource_estimates, inventory_status
        )
        
        # Step 8: Build route information for response
        selected_routes = []
        for zone, route in routes.items():
            if route:
                selected_routes.append({
                    "zone": zone,
                    "path": route["path"],
                    "path_coordinates": route["path_coordinates"],
                    "distance_km": route["total_distance_km"],
                    "time_min": route["total_time_min"],
                    "roads": route["roads_used"]
                })
        
        # Step 9: Build resources dispatched list
        resources_dispatched = [
            {"type": "medical_kits", "quantity": resource_estimates["medical_kits_required"], "status": "dispatching"},
            {"type": "food_packets", "quantity": resource_estimates["food_packets_required"], "status": "dispatching"},
            {"type": "water_liters", "quantity": resource_estimates["water_liters_required"], "status": "dispatching"},
            {"type": "trucks", "quantity": resource_estimates["trucks_required"], "status": "deploying"},
        ]
        
        if resource_estimates["boats_required"] > 0:
            resources_dispatched.append({"type": "boats", "quantity": resource_estimates["boats_required"], "status": "deploying"})
        if resource_estimates["drones_required"] > 0:
            resources_dispatched.append({"type": "drones", "quantity": resource_estimates["drones_required"], "status": "deploying"})
        if resource_estimates.get("helicopters_required", 0) > 0:
            resources_dispatched.append({"type": "helicopters", "quantity": resource_estimates["helicopters_required"], "status": "standby"})
        
        # Calculate supply gap and coverage
        medical_gap = inventory_status.get("medical_kits", {}).get("gap", 0)
        medical_available = inventory_status.get("medical_kits", {}).get("available", 10000)
        medical_required = inventory_status.get("medical_kits", {}).get("required", 0)
        coverage = min(100.0, (medical_available / max(1, medical_required)) * 100)
        
        # Build scenario summary
        disaster_type = scenario.get("disaster_type", "disaster")
        population = scenario.get("population_affected", 0)
        severity = scenario.get("severity_level", scenario.get("severity", 3))
        severity_label = scenario.get("severity_label", f"Level {severity}")
        hospital_load = scenario.get("hospital_load_pct", scenario.get("hospital_load", 50))
        city = scenario.get("city", "Chennai")
        
        scenario_summary = (
            f"{disaster_type.title()} in {city} affecting {population:,} people "
            f"in {', '.join(zones)}. Severity: {severity_label} ({severity}/5). "
            f"Hospital load: {hospital_load:.0f}%."
        )
        if blocked_roads:
            scenario_summary += f" Blocked roads: {', '.join(blocked_roads)}."
        if scenario.get("notes"):
            scenario_summary += f" Notes: {scenario['notes']}"
        
        decision_id = str(uuid.uuid4())[:8]
        
        # Get ML model feature importance for interpretability
        ml_interpretability = {}
        if self.ml_models_loaded:
            try:
                ml_interpretability = {
                    "demand_feature_importance": self.demand_model.get_feature_importance(),
                    "risk_feature_importance": self.risk_classifier.get_feature_importance() if self.risk_classifier.is_trained else {},
                    "prediction_method": resource_estimates.get("prediction_method", "rule_based")
                }
                # Log top features for debugging
                if ml_interpretability.get("demand_feature_importance"):
                    print(f"ML Model Interpretability for Decision {decision_id}:")
                    print(f"  Prediction Method: {ml_interpretability.get('prediction_method', 'N/A')}")
                    for resource, features in ml_interpretability["demand_feature_importance"].items():
                        if features:
                            top_features = sorted(features.items(), key=lambda x: x[1], reverse=True)[:3]
                            print(f"    {resource}: {', '.join([f'{f[0]}({f[1]:.2f})' for f in top_features])}")
            except Exception as e:
                print(f"Could not get ML interpretability: {e}")
                ml_interpretability = None
        
        decision = DecisionResponse(
            id=decision_id,
            timestamp=datetime.now().isoformat(),
            scenario_summary=scenario_summary,
            risk_level=risk_level,
            selected_routes=selected_routes,
            resources_dispatched=resources_dispatched,
            recommended_actions=recommended_actions,
            status="pending",
            weather_snapshot=weather,
            supply_gap=medical_gap,
            estimated_coverage=round(coverage, 1),
            similar_scenarios=similar_scenarios_info,
            primary_route_coordinates=primary_route_coords,
            ml_interpretability=ml_interpretability if ml_interpretability else None
        )
        
        self.decisions_history.append(decision)
        
        return decision
    
    def simulate_outcome_quality(self, decision: DecisionResponse) -> float:
        """Simulate the quality of the decision outcome for learning"""
        base_quality = 0.7
        
        if decision.risk_level == "CRITICAL" and decision.supply_gap == 0:
            base_quality += 0.2
        elif decision.supply_gap > 0:
            base_quality -= min(0.3, decision.supply_gap / 1000)
        
        if decision.estimated_coverage >= 90:
            base_quality += 0.1
        
        return min(1.0, max(0.0, base_quality))
    
    def update_learning_weights(self, decision: DecisionResponse, feedback: str):
        """Update internal weights based on decision feedback"""
        outcome = self.simulate_outcome_quality(decision)
        
        if feedback == "approved":
            for key in self.learning_weights:
                self.learning_weights[key] *= 1.01
        elif feedback == "aborted":
            for key in self.learning_weights:
                self.learning_weights[key] *= 0.98
        
        # Normalize weights
        total = sum(self.learning_weights.values())
        for key in self.learning_weights:
            self.learning_weights[key] /= total / 3


# Global agent instance
agent = ReliefRouteAgent()
