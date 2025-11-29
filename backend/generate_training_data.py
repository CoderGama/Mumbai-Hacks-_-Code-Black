"""
Generate comprehensive training data for ML models
Creates 50+ diverse scenarios for better model accuracy
"""
import json
import os
import random
import math

def generate_flood_scenario(idx, severity, is_coastal):
    """Generate a flood scenario"""
    severity_labels = {1: "Low", 2: "Moderate", 3: "High", 4: "Very High", 5: "Critical"}
    
    # Population scales with severity
    base_pop = random.randint(5000, 15000) * severity
    population = base_pop + random.randint(-2000, 5000)
    
    # Hospital load increases with severity
    base_load = 30 + severity * 12 + random.randint(-5, 10)
    hospital_load = min(99, max(20, base_load))
    
    # Water level and rainfall based on severity
    water_level = round(0.2 + severity * 0.4 + random.uniform(-0.1, 0.2), 2)
    rainfall = 50 + severity * 60 + random.randint(-20, 40)
    
    # Zones based on severity
    all_zones = ["East", "West", "North", "South", "Central"]
    num_zones = min(len(all_zones), max(1, severity - 1 + random.randint(0, 2)))
    zones = random.sample(all_zones, num_zones)
    
    # Blocked roads based on severity
    all_roads = ["OMR", "ECR", "Marina", "Anna Salai", "Mount Road", "GST Road", "Velachery Road"]
    num_blocked = min(len(all_roads), max(0, severity - 2 + random.randint(0, 2)))
    blocked = random.sample(all_roads, num_blocked) if num_blocked > 0 else []
    
    # Resources based on population and severity
    medical_kits = int(population * 0.08 * (severity / 3.0) + random.randint(-100, 200))
    food_packets = int(population * 0.2 + random.randint(-500, 500))
    water_liters = int(population * 3 + random.randint(-5000, 10000))
    shelter_kits = int(population * 0.01 + random.randint(-20, 50))
    boats = max(0, int(severity * 2 + len(zones) + random.randint(-1, 3)))
    trucks = max(2, int(len(zones) * 3 + random.randint(-2, 4)))
    drones = max(1, int(len(zones) + random.randint(0, 3)))
    helicopters = 0 if severity < 4 else random.randint(1, 3)
    
    location = "coastal" if is_coastal else "inland"
    
    return {
        "id": f"flood_{location}_{severity}_{idx}",
        "disaster_type": "flood",
        "city": "Chennai",
        "severity": severity,
        "severity_level": severity,
        "severity_label": severity_labels[severity],
        "population_affected": max(1000, population),
        "zones_affected": zones,
        "zones_impacted": zones,
        "hospital_load": round(hospital_load / 100, 2),
        "hospital_load_pct": hospital_load,
        "blocked_roads": blocked,
        "disaster_specific": {
            "flood": {
                "water_level_m": max(0.1, water_level),
                "rainfall_mm_24h": max(50, rainfall),
                "inland_or_coastal": location
            }
        },
        "resources_deployed": {
            "medical_kits": max(100, medical_kits),
            "boats": max(0, boats),
            "trucks": max(2, trucks),
            "drones": max(1, drones),
            "helicopters": helicopters,
            "food_packets": max(500, food_packets),
            "water_liters": max(5000, water_liters),
            "shelter_kits": max(50, shelter_kits)
        },
        "outcome": "successful",
        "response_time_min": 20 + severity * 10 + random.randint(-5, 15),
        "notes": f"{severity_labels[severity]} {location} flood scenario"
    }

def generate_cyclone_scenario(idx, severity, direction):
    """Generate a cyclone scenario"""
    severity_labels = {1: "Low", 2: "Moderate", 3: "High", 4: "Very High", 5: "Critical"}
    
    base_pop = random.randint(8000, 20000) * severity
    population = base_pop + random.randint(-3000, 8000)
    
    base_load = 35 + severity * 13 + random.randint(-5, 10)
    hospital_load = min(99, max(25, base_load))
    
    wind_speed = 60 + severity * 35 + random.randint(-15, 25)
    translation_speed = 12 + random.randint(0, 18)
    
    all_zones = ["East", "West", "North", "South", "Central"]
    num_zones = min(len(all_zones), max(1, severity - 1 + random.randint(0, 2)))
    zones = random.sample(all_zones, num_zones)
    
    all_roads = ["OMR", "ECR", "Marina", "Anna Salai", "Mount Road", "GST Road"]
    num_blocked = min(len(all_roads), max(0, severity - 1 + random.randint(0, 2)))
    blocked = random.sample(all_roads, num_blocked) if num_blocked > 0 else []
    
    medical_kits = int(population * 0.08 * (severity / 3.0) + random.randint(-150, 250))
    food_packets = int(population * 0.2 + random.randint(-600, 600))
    water_liters = int(population * 3 + random.randint(-6000, 12000))
    shelter_kits = int(population * 0.01 + random.randint(-25, 60))
    boats = max(0, int(severity + len(zones) + random.randint(-1, 2)))
    trucks = max(3, int(len(zones) * 4 + random.randint(-2, 5)))
    drones = max(1, int(len(zones) + severity + random.randint(0, 4)))
    helicopters = 0 if severity < 3 else random.randint(1, 4)
    
    return {
        "id": f"cyclone_{direction.lower()}_{severity}_{idx}",
        "disaster_type": "cyclone",
        "city": "Chennai",
        "severity": severity,
        "severity_level": severity,
        "severity_label": severity_labels[severity],
        "population_affected": max(2000, population),
        "zones_affected": zones,
        "zones_impacted": zones,
        "hospital_load": round(hospital_load / 100, 2),
        "hospital_load_pct": hospital_load,
        "blocked_roads": blocked,
        "disaster_specific": {
            "cyclone": {
                "max_wind_speed_kmph": max(60, wind_speed),
                "cyclone_translation_speed_kmph": translation_speed,
                "cyclone_direction": direction
            }
        },
        "resources_deployed": {
            "medical_kits": max(150, medical_kits),
            "boats": max(0, boats),
            "trucks": max(3, trucks),
            "drones": max(1, drones),
            "helicopters": helicopters,
            "food_packets": max(600, food_packets),
            "water_liters": max(8000, water_liters),
            "shelter_kits": max(60, shelter_kits)
        },
        "outcome": "successful",
        "response_time_min": 25 + severity * 12 + random.randint(-5, 18),
        "notes": f"{severity_labels[severity]} cyclone moving {direction}"
    }

def generate_earthquake_scenario(idx, severity, distance_category):
    """Generate an earthquake scenario"""
    severity_labels = {1: "Low", 2: "Moderate", 3: "High", 4: "Very High", 5: "Critical"}
    
    base_pop = random.randint(10000, 25000) * severity
    population = base_pop + random.randint(-5000, 10000)
    
    base_load = 40 + severity * 12 + random.randint(-5, 12)
    hospital_load = min(99, max(30, base_load))
    
    # Magnitude based on severity
    magnitude = 3.5 + severity * 0.9 + random.uniform(-0.3, 0.5)
    
    # Distance categories: near, medium, far
    distances = {"near": (10, 30), "medium": (30, 60), "far": (60, 100)}
    dist_range = distances.get(distance_category, (30, 60))
    epicenter_distance = random.randint(dist_range[0], dist_range[1])
    
    # Collapse ratio based on magnitude and distance
    base_collapse = (magnitude - 4) * 0.08 - (epicenter_distance / 500)
    collapse_ratio = max(0.01, min(0.5, base_collapse + random.uniform(-0.03, 0.05)))
    
    all_zones = ["East", "West", "North", "South", "Central"]
    num_zones = min(len(all_zones), max(1, severity + random.randint(-1, 1)))
    zones = random.sample(all_zones, num_zones)
    
    all_roads = ["Anna Salai", "Mount Road", "GST Road", "OMR", "ECR"]
    num_blocked = min(len(all_roads), max(0, int(collapse_ratio * 15) + random.randint(0, 2)))
    blocked = random.sample(all_roads, num_blocked) if num_blocked > 0 else []
    
    medical_kits = int(population * 0.08 * (severity / 3.0) * (1 + collapse_ratio) + random.randint(-200, 300))
    food_packets = int(population * 0.2 + random.randint(-700, 700))
    water_liters = int(population * 3 + random.randint(-7000, 14000))
    shelter_kits = int(population * 0.01 * (1 + collapse_ratio * 5) + random.randint(-30, 80))
    trucks = max(4, int(len(zones) * 4 + severity + random.randint(-2, 6)))
    drones = max(2, int(len(zones) * 2 + severity + random.randint(0, 5)))
    helicopters = 0 if severity < 3 or collapse_ratio < 0.1 else random.randint(1, 5)
    
    return {
        "id": f"earthquake_{distance_category}_{severity}_{idx}",
        "disaster_type": "earthquake",
        "city": "Chennai",
        "severity": severity,
        "severity_level": severity,
        "severity_label": severity_labels[severity],
        "population_affected": max(3000, population),
        "zones_affected": zones,
        "zones_impacted": zones,
        "hospital_load": round(hospital_load / 100, 2),
        "hospital_load_pct": hospital_load,
        "blocked_roads": blocked,
        "disaster_specific": {
            "earthquake": {
                "magnitude": round(max(3.0, magnitude), 1),
                "epicenter_distance_km": epicenter_distance,
                "building_collapse_ratio": round(collapse_ratio, 2)
            }
        },
        "resources_deployed": {
            "medical_kits": max(200, medical_kits),
            "boats": 0,
            "trucks": max(4, trucks),
            "drones": max(2, drones),
            "helicopters": helicopters,
            "food_packets": max(800, food_packets),
            "water_liters": max(10000, water_liters),
            "shelter_kits": max(80, shelter_kits)
        },
        "outcome": "successful",
        "response_time_min": 30 + severity * 15 + random.randint(-8, 20),
        "notes": f"{severity_labels[severity]} earthquake, epicenter {epicenter_distance}km away"
    }

def generate_heatwave_scenario(idx, severity, humidity_level):
    """Generate a heatwave scenario"""
    severity_labels = {1: "Low", 2: "Moderate", 3: "High", 4: "Very High", 5: "Critical"}
    
    base_pop = random.randint(6000, 18000) * severity
    population = base_pop + random.randint(-2500, 6000)
    
    base_load = 30 + severity * 11 + random.randint(-4, 8)
    hospital_load = min(99, max(20, base_load))
    
    # Temperature based on severity
    temperature = 38 + severity * 3 + random.randint(-2, 4)
    
    # Humidity categories: low, medium, high
    humidities = {"low": (10, 25), "medium": (25, 45), "high": (45, 70)}
    hum_range = humidities.get(humidity_level, (25, 45))
    humidity = random.randint(hum_range[0], hum_range[1])
    
    duration = severity + random.randint(0, 4)
    
    all_zones = ["East", "West", "North", "South", "Central"]
    num_zones = min(len(all_zones), max(1, severity - 1 + random.randint(0, 2)))
    zones = random.sample(all_zones, num_zones)
    
    medical_kits = int(population * 0.08 * (severity / 3.0) + random.randint(-100, 200))
    food_packets = int(population * 0.2 + random.randint(-400, 400))
    water_liters = int(population * 5 + random.randint(-5000, 15000))  # More water for heatwaves
    shelter_kits = int(population * 0.005 + random.randint(-10, 30))
    trucks = max(3, int(len(zones) * 3 + random.randint(-1, 4)))
    drones = max(1, int(len(zones) + random.randint(0, 2)))
    
    return {
        "id": f"heatwave_{humidity_level}_{severity}_{idx}",
        "disaster_type": "heatwave",
        "city": "Chennai",
        "severity": severity,
        "severity_level": severity,
        "severity_label": severity_labels[severity],
        "population_affected": max(1500, population),
        "zones_affected": zones,
        "zones_impacted": zones,
        "hospital_load": round(hospital_load / 100, 2),
        "hospital_load_pct": hospital_load,
        "blocked_roads": [],
        "disaster_specific": {
            "heatwave": {
                "max_temp_c": max(38, temperature),
                "humidity_pct": humidity,
                "duration_days": max(1, duration)
            }
        },
        "resources_deployed": {
            "medical_kits": max(100, medical_kits),
            "boats": 0,
            "trucks": max(3, trucks),
            "drones": max(1, drones),
            "helicopters": 0,
            "food_packets": max(400, food_packets),
            "water_liters": max(8000, water_liters),
            "shelter_kits": max(30, shelter_kits)
        },
        "outcome": "successful",
        "response_time_min": 15 + severity * 8 + random.randint(-3, 12),
        "notes": f"{severity_labels[severity]} heatwave with {humidity_level} humidity"
    }

def main():
    """Generate comprehensive training dataset"""
    random.seed(42)  # For reproducibility
    
    scenarios_dir = os.path.join(os.path.dirname(__file__), 'app', 'data', 'scenarios')
    os.makedirs(scenarios_dir, exist_ok=True)
    
    generated_count = 0
    
    # Generate flood scenarios (15 total)
    print("Generating flood scenarios...")
    for severity in range(1, 6):
        for i, is_coastal in enumerate([True, False, True]):
            scenario = generate_flood_scenario(i + 1, severity, is_coastal)
            filepath = os.path.join(scenarios_dir, f"{scenario['id']}.json")
            with open(filepath, 'w') as f:
                json.dump(scenario, f, indent=2)
            generated_count += 1
    
    # Generate cyclone scenarios (15 total)
    print("Generating cyclone scenarios...")
    directions = ["NE", "E", "SE", "N", "NW"]
    for severity in range(1, 6):
        for i, direction in enumerate(random.sample(directions, 3)):
            scenario = generate_cyclone_scenario(i + 1, severity, direction)
            filepath = os.path.join(scenarios_dir, f"{scenario['id']}.json")
            with open(filepath, 'w') as f:
                json.dump(scenario, f, indent=2)
            generated_count += 1
    
    # Generate earthquake scenarios (15 total)
    print("Generating earthquake scenarios...")
    distances = ["near", "medium", "far"]
    for severity in range(1, 6):
        for i, distance in enumerate(distances):
            scenario = generate_earthquake_scenario(i + 1, severity, distance)
            filepath = os.path.join(scenarios_dir, f"{scenario['id']}.json")
            with open(filepath, 'w') as f:
                json.dump(scenario, f, indent=2)
            generated_count += 1
    
    # Generate heatwave scenarios (15 total)
    print("Generating heatwave scenarios...")
    humidities = ["low", "medium", "high"]
    for severity in range(1, 6):
        for i, humidity in enumerate(humidities):
            scenario = generate_heatwave_scenario(i + 1, severity, humidity)
            filepath = os.path.join(scenarios_dir, f"{scenario['id']}.json")
            with open(filepath, 'w') as f:
                json.dump(scenario, f, indent=2)
            generated_count += 1
    
    print(f"\n✅ Generated {generated_count} training scenarios")
    print(f"📁 Saved to: {scenarios_dir}")
    
    # List all scenario files
    all_files = [f for f in os.listdir(scenarios_dir) if f.endswith('.json')]
    print(f"\n📊 Total scenario files: {len(all_files)}")
    
    # Summary by disaster type
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

