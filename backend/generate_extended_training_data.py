"""
Generate extended training data for high accuracy ML models
Creates 200+ diverse scenarios for >96% model accuracy
"""
import json
import os
import random
import math

def generate_scenario(disaster_type, severity, variation_idx, specific_params):
    """Generate a scenario with specific parameters"""
    severity_labels = {1: "Low", 2: "Moderate", 3: "High", 4: "Very High", 5: "Critical"}
    
    # Base population scales with severity
    base_multipliers = {1: 1.0, 2: 1.5, 3: 2.0, 4: 3.0, 5: 4.5}
    base_pop = int(5000 * base_multipliers[severity] * (1 + random.uniform(-0.2, 0.3)))
    
    # Hospital load increases with severity
    base_load = 25 + severity * 14 + random.randint(-4, 8)
    hospital_load = min(99, max(20, base_load))
    
    # Zones based on severity
    all_zones = ["East", "West", "North", "South", "Central"]
    num_zones = min(len(all_zones), max(1, (severity + 1) // 2 + random.randint(0, 2)))
    zones = random.sample(all_zones, num_zones)
    
    # Blocked roads
    all_roads = ["OMR", "ECR", "Marina", "Anna Salai", "Mount Road", "GST Road", "Velachery Road"]
    num_blocked = min(len(all_roads), max(0, severity - 2 + random.randint(-1, 2)))
    blocked = random.sample(all_roads, num_blocked) if num_blocked > 0 else []
    
    # Resource calculations with strong correlation to severity and population
    pop_factor = base_pop / 10000
    severity_factor = severity / 3.0
    
    # Medical kits: ~8% of population, scaled by severity
    medical_kits = int(base_pop * 0.08 * severity_factor * (1 + random.uniform(-0.1, 0.15)))
    food_packets = int(base_pop * 0.2 * (1 + random.uniform(-0.1, 0.1)))
    water_liters = int(base_pop * 3 * (1 + random.uniform(-0.1, 0.15)))
    shelter_kits = int(base_pop * 0.01 * severity_factor * (1 + random.uniform(-0.1, 0.15)))
    
    # Vehicles based on zones and severity
    trucks = max(2, int(len(zones) * 2 + severity + random.randint(-1, 2)))
    drones = max(1, int(len(zones) + random.randint(0, 2)))
    
    scenario_id = f"{disaster_type}_{specific_params.get('subtype', 'v')}_{severity}_{variation_idx}"
    
    base_scenario = {
        "id": scenario_id,
        "disaster_type": disaster_type,
        "city": "Chennai",
        "severity": severity,
        "severity_level": severity,
        "severity_label": severity_labels[severity],
        "population_affected": max(1000, base_pop),
        "zones_affected": zones,
        "zones_impacted": zones,
        "hospital_load": round(hospital_load / 100, 2),
        "hospital_load_pct": hospital_load,
        "blocked_roads": blocked,
        "resources_deployed": {
            "medical_kits": max(50, medical_kits),
            "trucks": max(2, trucks),
            "drones": max(1, drones),
            "food_packets": max(200, food_packets),
            "water_liters": max(3000, water_liters),
            "shelter_kits": max(20, shelter_kits)
        },
        "outcome": "successful",
        "response_time_min": 15 + severity * 10 + random.randint(-5, 15)
    }
    
    # Add disaster-specific data
    if disaster_type == "flood":
        water_level = specific_params.get("water_level", 0.3 + severity * 0.35)
        rainfall = specific_params.get("rainfall", 60 + severity * 55)
        location = specific_params.get("location", "inland")
        
        base_scenario["disaster_specific"] = {
            "flood": {
                "water_level_m": round(water_level + random.uniform(-0.1, 0.15), 2),
                "rainfall_mm_24h": int(rainfall + random.randint(-20, 30)),
                "inland_or_coastal": location
            }
        }
        boats = max(0, int(severity * 2 + len(zones) + random.randint(-1, 2))) if location == "coastal" or water_level > 0.8 else 0
        helicopters = random.randint(1, 3) if severity >= 4 and water_level > 1.2 else 0
        base_scenario["resources_deployed"]["boats"] = boats
        base_scenario["resources_deployed"]["helicopters"] = helicopters
        base_scenario["notes"] = f"{severity_labels[severity]} {location} flood"
        
    elif disaster_type == "cyclone":
        wind_speed = specific_params.get("wind_speed", 50 + severity * 35)
        direction = specific_params.get("direction", "NE")
        translation = specific_params.get("translation", 15)
        
        base_scenario["disaster_specific"] = {
            "cyclone": {
                "max_wind_speed_kmph": int(wind_speed + random.randint(-10, 15)),
                "cyclone_translation_speed_kmph": int(translation + random.randint(-3, 5)),
                "cyclone_direction": direction
            }
        }
        boats = max(0, int(severity + len(zones) + random.randint(-1, 2)))
        helicopters = random.randint(1, 4) if severity >= 3 else 0
        base_scenario["resources_deployed"]["boats"] = boats
        base_scenario["resources_deployed"]["helicopters"] = helicopters
        base_scenario["notes"] = f"{severity_labels[severity]} cyclone moving {direction}"
        
    elif disaster_type == "earthquake":
        magnitude = specific_params.get("magnitude", 3.5 + severity * 0.85)
        distance = specific_params.get("distance", 80 - severity * 12)
        collapse = specific_params.get("collapse", severity * 0.06)
        
        base_scenario["disaster_specific"] = {
            "earthquake": {
                "magnitude": round(magnitude + random.uniform(-0.2, 0.3), 1),
                "epicenter_distance_km": int(distance + random.randint(-10, 15)),
                "building_collapse_ratio": round(min(0.5, max(0.01, collapse + random.uniform(-0.02, 0.03))), 2)
            }
        }
        # More trucks and drones for search and rescue
        base_scenario["resources_deployed"]["trucks"] = max(4, int(len(zones) * 3 + severity + random.randint(-1, 3)))
        base_scenario["resources_deployed"]["drones"] = max(2, int(len(zones) * 2 + random.randint(0, 3)))
        base_scenario["resources_deployed"]["boats"] = 0
        helicopters = random.randint(1, 5) if severity >= 4 or collapse > 0.15 else 0
        base_scenario["resources_deployed"]["helicopters"] = helicopters
        base_scenario["notes"] = f"{severity_labels[severity]} earthquake M{round(magnitude, 1)}"
        
    elif disaster_type == "heatwave":
        temperature = specific_params.get("temperature", 37 + severity * 3)
        humidity = specific_params.get("humidity", 30)
        duration = specific_params.get("duration", severity + 1)
        
        base_scenario["disaster_specific"] = {
            "heatwave": {
                "max_temp_c": int(temperature + random.randint(-1, 3)),
                "humidity_pct": int(humidity + random.randint(-5, 8)),
                "duration_days": max(1, int(duration + random.randint(-1, 2)))
            }
        }
        # More water for heatwaves
        base_scenario["resources_deployed"]["water_liters"] = int(base_pop * 5 * (1 + random.uniform(-0.1, 0.15)))
        base_scenario["resources_deployed"]["boats"] = 0
        base_scenario["resources_deployed"]["helicopters"] = 0
        base_scenario["blocked_roads"] = []  # Roads not blocked in heatwaves
        base_scenario["notes"] = f"{severity_labels[severity]} heatwave {int(temperature)}°C"
    
    return base_scenario

def main():
    """Generate extended training dataset"""
    random.seed(123)  # For reproducibility
    
    scenarios_dir = os.path.join(os.path.dirname(__file__), 'app', 'data', 'scenarios')
    os.makedirs(scenarios_dir, exist_ok=True)
    
    generated_count = 0
    
    print("Generating extended training data for high accuracy...")
    
    # FLOOD scenarios (50 variations)
    print("\n📊 Generating FLOOD scenarios...")
    flood_configs = [
        {"location": "coastal", "water_level": 0.3, "rainfall": 80},
        {"location": "coastal", "water_level": 0.6, "rainfall": 150},
        {"location": "coastal", "water_level": 1.0, "rainfall": 250},
        {"location": "coastal", "water_level": 1.5, "rainfall": 350},
        {"location": "coastal", "water_level": 2.0, "rainfall": 450},
        {"location": "inland", "water_level": 0.2, "rainfall": 60},
        {"location": "inland", "water_level": 0.4, "rainfall": 120},
        {"location": "inland", "water_level": 0.7, "rainfall": 200},
        {"location": "inland", "water_level": 1.0, "rainfall": 280},
        {"location": "inland", "water_level": 1.3, "rainfall": 350},
    ]
    
    for severity in range(1, 6):
        for idx, config in enumerate(flood_configs):
            scenario = generate_scenario("flood", severity, idx + 1, {
                "subtype": f"{config['location'][:2]}_{int(config['water_level']*10)}",
                "location": config["location"],
                "water_level": config["water_level"],
                "rainfall": config["rainfall"]
            })
            filepath = os.path.join(scenarios_dir, f"{scenario['id']}.json")
            with open(filepath, 'w') as f:
                json.dump(scenario, f, indent=2)
            generated_count += 1
    
    # CYCLONE scenarios (50 variations)
    print("📊 Generating CYCLONE scenarios...")
    cyclone_configs = [
        {"direction": "NE", "wind_speed": 60, "translation": 12},
        {"direction": "NE", "wind_speed": 100, "translation": 18},
        {"direction": "NE", "wind_speed": 150, "translation": 25},
        {"direction": "E", "wind_speed": 80, "translation": 15},
        {"direction": "E", "wind_speed": 130, "translation": 22},
        {"direction": "E", "wind_speed": 180, "translation": 28},
        {"direction": "SE", "wind_speed": 70, "translation": 14},
        {"direction": "SE", "wind_speed": 120, "translation": 20},
        {"direction": "N", "wind_speed": 90, "translation": 16},
        {"direction": "NW", "wind_speed": 110, "translation": 19},
    ]
    
    for severity in range(1, 6):
        for idx, config in enumerate(cyclone_configs):
            scenario = generate_scenario("cyclone", severity, idx + 1, {
                "subtype": f"{config['direction']}_{int(config['wind_speed']//10)}",
                "direction": config["direction"],
                "wind_speed": config["wind_speed"],
                "translation": config["translation"]
            })
            filepath = os.path.join(scenarios_dir, f"{scenario['id']}.json")
            with open(filepath, 'w') as f:
                json.dump(scenario, f, indent=2)
            generated_count += 1
    
    # EARTHQUAKE scenarios (50 variations)
    print("📊 Generating EARTHQUAKE scenarios...")
    earthquake_configs = [
        {"magnitude": 3.5, "distance": 80, "collapse": 0.02},
        {"magnitude": 4.0, "distance": 70, "collapse": 0.04},
        {"magnitude": 4.5, "distance": 60, "collapse": 0.07},
        {"magnitude": 5.0, "distance": 50, "collapse": 0.10},
        {"magnitude": 5.5, "distance": 40, "collapse": 0.14},
        {"magnitude": 6.0, "distance": 30, "collapse": 0.18},
        {"magnitude": 6.5, "distance": 25, "collapse": 0.24},
        {"magnitude": 7.0, "distance": 20, "collapse": 0.30},
        {"magnitude": 7.5, "distance": 15, "collapse": 0.38},
        {"magnitude": 8.0, "distance": 10, "collapse": 0.45},
    ]
    
    for severity in range(1, 6):
        for idx, config in enumerate(earthquake_configs):
            scenario = generate_scenario("earthquake", severity, idx + 1, {
                "subtype": f"m{int(config['magnitude']*10)}",
                "magnitude": config["magnitude"],
                "distance": config["distance"],
                "collapse": config["collapse"]
            })
            filepath = os.path.join(scenarios_dir, f"{scenario['id']}.json")
            with open(filepath, 'w') as f:
                json.dump(scenario, f, indent=2)
            generated_count += 1
    
    # HEATWAVE scenarios (50 variations)
    print("📊 Generating HEATWAVE scenarios...")
    heatwave_configs = [
        {"temperature": 38, "humidity": 15, "duration": 2},
        {"temperature": 40, "humidity": 20, "duration": 3},
        {"temperature": 42, "humidity": 25, "duration": 4},
        {"temperature": 44, "humidity": 30, "duration": 5},
        {"temperature": 46, "humidity": 35, "duration": 6},
        {"temperature": 48, "humidity": 40, "duration": 7},
        {"temperature": 50, "humidity": 45, "duration": 8},
        {"temperature": 42, "humidity": 50, "duration": 4},
        {"temperature": 45, "humidity": 55, "duration": 5},
        {"temperature": 47, "humidity": 60, "duration": 6},
    ]
    
    for severity in range(1, 6):
        for idx, config in enumerate(heatwave_configs):
            scenario = generate_scenario("heatwave", severity, idx + 1, {
                "subtype": f"t{config['temperature']}h{config['humidity']}",
                "temperature": config["temperature"],
                "humidity": config["humidity"],
                "duration": config["duration"]
            })
            filepath = os.path.join(scenarios_dir, f"{scenario['id']}.json")
            with open(filepath, 'w') as f:
                json.dump(scenario, f, indent=2)
            generated_count += 1
    
    print(f"\n✅ Generated {generated_count} additional training scenarios")
    
    # Count all scenarios
    all_files = [f for f in os.listdir(scenarios_dir) if f.endswith('.json')]
    print(f"\n📊 Total scenario files: {len(all_files)}")
    
    flood_count = len([f for f in all_files if 'flood' in f.lower()])
    cyclone_count = len([f for f in all_files if 'cyclone' in f.lower()])
    earthquake_count = len([f for f in all_files if 'earthquake' in f.lower()])
    heatwave_count = len([f for f in all_files if 'heatwave' in f.lower()])
    
    print(f"\n   Flood scenarios: {flood_count}")
    print(f"   Cyclone scenarios: {cyclone_count}")
    print(f"   Earthquake scenarios: {earthquake_count}")
    print(f"   Heatwave scenarios: {heatwave_count}")

if __name__ == "__main__":
    main()


# touch update 11/29/2025 12:45:26
