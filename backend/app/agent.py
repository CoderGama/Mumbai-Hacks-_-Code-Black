"""
ReliefRoute Agentic AI Core
"""
import math
import uuid
from datetime import datetime
from typing import List, Dict, Optional
import random

from .scenarios import CHENNAI_SCENARIOS, DEPOT_INVENTORY, ZONES
from .routing import find_routes_to_zones, a_star_route, find_alternative_route
from .models import ScenarioRequest, DecisionResponse

class ReliefRouteAgent:
    """Autonomous disaster relief decision-making agent"""
    
    def __init__(self):
        self.decisions_history = []
        self.learning_weights = {
            "medical": 1.0,
            "evacuation": 1.0,
            "infrastructure": 1.0
        }
        
    def calculate_scenario_similarity(self, current: Dict, historical: Dict) -> float:
        """Calculate similarity score between scenarios using weighted distance metric"""
        weights = {
            "severity": 2.0,
            "population": 1.5,
            "hospital_load": 1.8,
            "zones_count": 1.0,
            "blocked_roads_count": 1.2
        }
        
        # Normalize values for comparison
        severity_diff = abs(current["severity"] - historical["severity"]) / 5.0
        pop_diff = abs(current["population_affected"] - historical["population_affected"]) / 100000.0
        hospital_diff = abs(current["hospital_load"] - historical["hospital_load"])
        zones_diff = abs(len(current["zones_affected"]) - len(historical["zones_affected"])) / 5.0
        blocked_diff = abs(len(current["blocked_roads"]) - len(historical.get("blocked_roads", []))) / 5.0
        
        distance = math.sqrt(
            weights["severity"] * severity_diff ** 2 +
            weights["population"] * pop_diff ** 2 +
            weights["hospital_load"] * hospital_diff ** 2 +
            weights["zones_count"] * zones_diff ** 2 +
            weights["blocked_roads_count"] * blocked_diff ** 2
        )
        
        return distance
    
    def find_similar_scenarios(self, scenario: Dict, top_k: int = 3) -> List[Dict]:
        """Find most similar historical scenarios"""
        # Filter by disaster type first
        same_type = [s for s in CHENNAI_SCENARIOS if s["disaster_type"] == scenario["disaster_type"]]
        
        if not same_type:
            same_type = CHENNAI_SCENARIOS  # Fall back to all scenarios
        
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
        """Estimate required resources based on scenario and historical data"""
        severity = scenario["severity"]
        population = scenario["population_affected"]
        hospital_load = scenario["hospital_load"]
        num_zones = len(scenario["zones_affected"])
        
        # Base calculations using humanitarian heuristics
        # Approximately 10% of affected population needs immediate medical attention
        people_needing_care = int(population * 0.10 * (hospital_load / 50))
        
        # Medical kits: 1 per 10 people needing care
        medical_kits_needed = max(100, people_needing_care // 10)
        
        # Adjust based on similar scenarios
        if similar_scenarios:
            avg_kits = sum(s["scenario"]["resources_deployed"].get("medical_kits", 0) 
                         for s in similar_scenarios) / len(similar_scenarios)
            medical_kits_needed = int((medical_kits_needed + avg_kits) / 2)
        
        # Vehicle requirements
        boats_needed = 0
        drones_needed = 0
        trucks_needed = max(2, num_zones * 2)
        helicopters_needed = 0
        
        if scenario["disaster_type"] in ["flood", "cyclone"]:
            boats_needed = max(1, severity - 1) * num_zones
            if severity >= 4:
                helicopters_needed = 1
            if severity >= 5:
                helicopters_needed = 2
        
        drones_needed = max(1, num_zones)
        
        # Food and water calculations
        food_packets = population // 10
        water_liters = population * 3  # 3 liters per person per day
        
        return {
            "medical_kits_required": medical_kits_needed,
            "food_packets_required": food_packets,
            "water_liters_required": water_liters,
            "shelter_kits_required": population // 100,
            "boats_required": boats_needed,
            "drones_required": drones_needed,
            "trucks_required": trucks_needed,
            "helicopters_required": helicopters_needed
        }
    
    def check_inventory(self, required: Dict) -> Dict:
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
        
        for depot_id, depot in DEPOT_INVENTORY.items():
            for resource, amount in depot["resources"].items():
                if resource in total_available:
                    total_available[resource] += amount
            for vehicle, count in depot["vehicles"].items():
                if vehicle in total_available:
                    total_available[vehicle] += count
        
        gaps = {}
        for resource, required_amount in required.items():
            resource_key = resource.replace("_required", "")
            available = total_available.get(resource_key, 0)
            gap = max(0, required_amount - available)
            gaps[resource_key] = {
                "required": required_amount,
                "available": available,
                "gap": gap
            }
        
        return gaps
    
    def generate_weather_snapshot(self, scenario: Dict) -> Dict:
        """Generate simulated weather data based on disaster type"""
        disaster_type = scenario["disaster_type"]
        severity = scenario["severity"]
        
        if disaster_type == "flood":
            return {
                "rainfall_24h_mm": 150 + severity * 50 + random.randint(-20, 30),
                "wind_speed_kmh": 30 + severity * 10 + random.randint(-5, 15),
                "flood_depth_m": round(0.3 + severity * 0.3 + random.uniform(-0.1, 0.2), 1),
                "humidity_percent": 85 + random.randint(-5, 10)
            }
        elif disaster_type == "cyclone":
            return {
                "rainfall_24h_mm": 100 + severity * 40 + random.randint(-20, 30),
                "wind_speed_kmh": 80 + severity * 25 + random.randint(-10, 20),
                "flood_depth_m": round(0.2 + severity * 0.2 + random.uniform(-0.1, 0.1), 1),
                "storm_surge_m": round(0.5 + severity * 0.3, 1)
            }
        elif disaster_type == "heatwave":
            return {
                "temperature_c": 40 + severity * 2 + random.randint(-1, 2),
                "humidity_percent": 35 - severity * 3 + random.randint(-5, 5),
                "heat_index": 45 + severity * 3
            }
        else:
            return {
                "conditions": "Monitoring active",
                "severity_index": severity
            }
    
    def determine_risk_level(self, scenario: Dict, inventory_status: Dict) -> str:
        """Determine overall risk level"""
        severity = scenario["severity"]
        hospital_load = scenario["hospital_load"]
        
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
        disaster_type = scenario["disaster_type"]
        zones = scenario["zones_affected"]
        blocked = scenario["blocked_roads"]
        
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
        
        drones = resource_estimates["drones_required"]
        if drones > 0:
            actions.append(f"Use drones to deliver critical supplies to inaccessible areas. -> Resource: drones x {drones} -> Zones: {', '.join(zones)}")
        
        trucks = resource_estimates["trucks_required"]
        actions.append(f"Dispatch ground convoy with supplies. -> Resource: trucks x {trucks}")
        
        # Handle blocked roads
        if blocked:
            actions.append(f"Reroute ground vehicles to avoid blocked roads: {', '.join(blocked)} -> Zones: {', '.join(zones)}")
        
        # Hospital surge support
        if scenario["hospital_load"] >= 70:
            actions.append(f"Trigger hospital surge support protocol. ICU load at {scenario['hospital_load']}%")
        
        # Helicopter for severe cases
        helicopters = resource_estimates.get("helicopters_required", 0)
        if helicopters > 0:
            actions.append(f"Dispatch helicopter for emergency evacuation. -> Resource: helicopters x {helicopters}")
        
        # Pre-positioning recommendation
        if scenario["severity"] >= 3:
            actions.append("Pre-position additional supplies at nearest operational depot for rapid redeployment.")
        
        return actions
    
    def run(self, request: ScenarioRequest) -> DecisionResponse:
        """Main agent execution - process scenario and generate decision"""
        scenario = {
            "disaster_type": request.disaster_type,
            "severity": request.severity,
            "population_affected": request.population_affected,
            "zones_affected": request.zones_affected,
            "hospital_load": request.hospital_load / 100.0 if request.hospital_load > 1 else request.hospital_load,
            "blocked_roads": request.blocked_roads
        }
        
        # Step 1: Find similar historical scenarios
        similar = self.find_similar_scenarios(scenario)
        similar_scenarios_info = [
            {
                "id": s["scenario"]["id"],
                "distance": s["distance"],
                "severity": s["scenario"]["severity"],
                "hospital_load": s["scenario"]["hospital_load"]
            }
            for s in similar
        ]
        
        # Step 2: Estimate resource requirements
        resource_estimates = self.estimate_resources(scenario, similar)
        
        # Step 3: Check inventory
        inventory_status = self.check_inventory(resource_estimates)
        
        # Step 4: Calculate routes
        routes = find_routes_to_zones("Central_Depot", request.zones_affected, request.blocked_roads)
        
        # Find best route (to first zone)
        primary_zone = request.zones_affected[0] if request.zones_affected else "Central"
        primary_route = routes.get(primary_zone)
        
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
        scenario_summary = (
            f"{request.disaster_type.title()} affecting {request.population_affected:,} people "
            f"in {', '.join(request.zones_affected)}. Severity: {request.severity}/5. "
            f"Hospital load: {request.hospital_load}%."
        )
        if request.blocked_roads:
            scenario_summary += f" Blocked roads: {', '.join(request.blocked_roads)}."
        
        decision_id = str(uuid.uuid4())[:8]
        
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
            similar_scenarios=similar_scenarios_info
        )
        
        self.decisions_history.append(decision)
        
        return decision
    
    def simulate_outcome_quality(self, decision: DecisionResponse) -> float:
        """Simulate the quality of the decision outcome for learning"""
        # This would be updated with real feedback in production
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
            # Reinforce current weights slightly
            for key in self.learning_weights:
                self.learning_weights[key] *= 1.01
        elif feedback == "aborted":
            # Reduce weights slightly
            for key in self.learning_weights:
                self.learning_weights[key] *= 0.98
        
        # Normalize weights
        total = sum(self.learning_weights.values())
        for key in self.learning_weights:
            self.learning_weights[key] /= total / 3


# Global agent instance
agent = ReliefRouteAgent()

