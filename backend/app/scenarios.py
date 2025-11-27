"""
Historical scenarios for Chennai - used for similarity matching
"""

CHENNAI_SCENARIOS = [
    # Flood scenarios
    {
        "id": "chennai_flood_1",
        "disaster_type": "flood",
        "city": "Chennai",
        "severity": 2,
        "population_affected": 12000,
        "zones_affected": ["North", "Central"],
        "hospital_load": 0.65,
        "blocked_roads": ["OMR"],
        "rainfall_mm": 180,
        "wind_speed_kmh": 35,
        "flood_depth_m": 0.5,
        "resources_deployed": {
            "medical_kits": 800,
            "boats": 2,
            "trucks": 5,
            "drones": 1
        },
        "outcome": "successful"
    },
    {
        "id": "chennai_flood_2",
        "disaster_type": "flood",
        "city": "Chennai",
        "severity": 4,
        "population_affected": 25000,
        "zones_affected": ["East", "West", "Central"],
        "hospital_load": 0.82,
        "blocked_roads": ["OMR", "Anna_Salai"],
        "rainfall_mm": 320,
        "wind_speed_kmh": 65,
        "flood_depth_m": 1.2,
        "resources_deployed": {
            "medical_kits": 2000,
            "boats": 5,
            "trucks": 8,
            "drones": 3
        },
        "outcome": "successful"
    },
    {
        "id": "chennai_flood_3",
        "disaster_type": "flood",
        "city": "Chennai",
        "severity": 5,
        "population_affected": 45000,
        "zones_affected": ["North", "South", "East", "West", "Central"],
        "hospital_load": 0.93,
        "blocked_roads": ["OMR", "Anna_Salai", "Mount_Road", "ECR"],
        "rainfall_mm": 450,
        "wind_speed_kmh": 80,
        "flood_depth_m": 2.0,
        "resources_deployed": {
            "medical_kits": 5000,
            "boats": 10,
            "trucks": 15,
            "drones": 6,
            "helicopters": 2
        },
        "outcome": "partial"
    },
    {
        "id": "chennai_flood_4",
        "disaster_type": "flood",
        "city": "Chennai",
        "severity": 3,
        "population_affected": 18000,
        "zones_affected": ["South", "Central"],
        "hospital_load": 0.70,
        "blocked_roads": ["ECR"],
        "rainfall_mm": 220,
        "wind_speed_kmh": 45,
        "flood_depth_m": 0.7,
        "resources_deployed": {
            "medical_kits": 1200,
            "boats": 3,
            "trucks": 6,
            "drones": 2
        },
        "outcome": "successful"
    },
    {
        "id": "chennai_flood_5",
        "disaster_type": "flood",
        "city": "Chennai",
        "severity": 4,
        "population_affected": 30000,
        "zones_affected": ["North", "East"],
        "hospital_load": 0.85,
        "blocked_roads": ["OMR", "Velachery_Main"],
        "rainfall_mm": 350,
        "wind_speed_kmh": 70,
        "flood_depth_m": 1.4,
        "resources_deployed": {
            "medical_kits": 2500,
            "boats": 6,
            "trucks": 10,
            "drones": 4
        },
        "outcome": "successful"
    },
    
    # Cyclone scenarios
    {
        "id": "chennai_cyclone_1",
        "disaster_type": "cyclone",
        "city": "Chennai",
        "severity": 3,
        "population_affected": 20000,
        "zones_affected": ["East", "South"],
        "hospital_load": 0.60,
        "blocked_roads": ["ECR", "OMR"],
        "rainfall_mm": 150,
        "wind_speed_kmh": 120,
        "flood_depth_m": 0.3,
        "resources_deployed": {
            "medical_kits": 1500,
            "boats": 2,
            "trucks": 7,
            "drones": 3
        },
        "outcome": "successful"
    },
    {
        "id": "chennai_cyclone_2",
        "disaster_type": "cyclone",
        "city": "Chennai",
        "severity": 4,
        "population_affected": 35000,
        "zones_affected": ["East", "South", "Central"],
        "hospital_load": 0.78,
        "blocked_roads": ["ECR", "OMR", "Marina"],
        "rainfall_mm": 200,
        "wind_speed_kmh": 150,
        "flood_depth_m": 0.6,
        "resources_deployed": {
            "medical_kits": 3000,
            "boats": 4,
            "trucks": 12,
            "drones": 5,
            "helicopters": 1
        },
        "outcome": "successful"
    },
    {
        "id": "chennai_cyclone_3",
        "disaster_type": "cyclone",
        "city": "Chennai",
        "severity": 5,
        "population_affected": 55000,
        "zones_affected": ["North", "South", "East", "West", "Central"],
        "hospital_load": 0.92,
        "blocked_roads": ["ECR", "OMR", "Marina", "Mount_Road", "Anna_Salai"],
        "rainfall_mm": 280,
        "wind_speed_kmh": 180,
        "flood_depth_m": 1.0,
        "resources_deployed": {
            "medical_kits": 6000,
            "boats": 8,
            "trucks": 18,
            "drones": 8,
            "helicopters": 3
        },
        "outcome": "partial"
    },
    {
        "id": "chennai_cyclone_4",
        "disaster_type": "cyclone",
        "city": "Chennai",
        "severity": 2,
        "population_affected": 10000,
        "zones_affected": ["East"],
        "hospital_load": 0.45,
        "blocked_roads": ["ECR"],
        "rainfall_mm": 100,
        "wind_speed_kmh": 90,
        "flood_depth_m": 0.2,
        "resources_deployed": {
            "medical_kits": 700,
            "boats": 1,
            "trucks": 4,
            "drones": 2
        },
        "outcome": "successful"
    },
    {
        "id": "chennai_cyclone_5",
        "disaster_type": "cyclone",
        "city": "Chennai",
        "severity": 4,
        "population_affected": 40000,
        "zones_affected": ["South", "West", "Central"],
        "hospital_load": 0.80,
        "blocked_roads": ["Anna_Salai", "Mount_Road"],
        "rainfall_mm": 220,
        "wind_speed_kmh": 140,
        "flood_depth_m": 0.5,
        "resources_deployed": {
            "medical_kits": 3500,
            "boats": 5,
            "trucks": 14,
            "drones": 6
        },
        "outcome": "successful"
    },
    
    # Heatwave scenarios
    {
        "id": "chennai_heatwave_1",
        "disaster_type": "heatwave",
        "city": "Chennai",
        "severity": 3,
        "population_affected": 50000,
        "zones_affected": ["North", "Central", "West"],
        "hospital_load": 0.72,
        "blocked_roads": [],
        "temperature_c": 44,
        "humidity_percent": 35,
        "resources_deployed": {
            "medical_kits": 2000,
            "water_liters": 100000,
            "cooling_units": 50,
            "trucks": 10
        },
        "outcome": "successful"
    },
    {
        "id": "chennai_heatwave_2",
        "disaster_type": "heatwave",
        "city": "Chennai",
        "severity": 4,
        "population_affected": 80000,
        "zones_affected": ["North", "South", "Central", "West"],
        "hospital_load": 0.85,
        "blocked_roads": [],
        "temperature_c": 47,
        "humidity_percent": 30,
        "resources_deployed": {
            "medical_kits": 4000,
            "water_liters": 200000,
            "cooling_units": 100,
            "trucks": 18
        },
        "outcome": "successful"
    },
    {
        "id": "chennai_heatwave_3",
        "disaster_type": "heatwave",
        "city": "Chennai",
        "severity": 5,
        "population_affected": 120000,
        "zones_affected": ["North", "South", "East", "West", "Central"],
        "hospital_load": 0.95,
        "blocked_roads": [],
        "temperature_c": 50,
        "humidity_percent": 25,
        "resources_deployed": {
            "medical_kits": 7000,
            "water_liters": 350000,
            "cooling_units": 200,
            "trucks": 25
        },
        "outcome": "partial"
    },
    {
        "id": "chennai_heatwave_4",
        "disaster_type": "heatwave",
        "city": "Chennai",
        "severity": 2,
        "population_affected": 25000,
        "zones_affected": ["Central"],
        "hospital_load": 0.50,
        "blocked_roads": [],
        "temperature_c": 42,
        "humidity_percent": 40,
        "resources_deployed": {
            "medical_kits": 1000,
            "water_liters": 50000,
            "cooling_units": 25,
            "trucks": 5
        },
        "outcome": "successful"
    },
    {
        "id": "chennai_heatwave_5",
        "disaster_type": "heatwave",
        "city": "Chennai",
        "severity": 3,
        "population_affected": 60000,
        "zones_affected": ["South", "East"],
        "hospital_load": 0.68,
        "blocked_roads": [],
        "temperature_c": 45,
        "humidity_percent": 32,
        "resources_deployed": {
            "medical_kits": 2500,
            "water_liters": 120000,
            "cooling_units": 60,
            "trucks": 12
        },
        "outcome": "successful"
    }
]

# Initial inventory at depots
DEPOT_INVENTORY = {
    "central_depot": {
        "name": "Central Depot",
        "location": "Chennai Central",
        "coordinates": [13.0827, 80.2707],
        "resources": {
            "medical_kits": 10000,
            "food_packets": 50000,
            "water_liters": 500000,
            "shelter_kits": 2000,
            "oxygen_cylinders": 500,
            "vaccines": 5000,
            "surgical_kits": 200
        },
        "vehicles": {
            "trucks": 20,
            "boats": 8,
            "drones": 10,
            "helicopters": 2
        }
    },
    "north_depot": {
        "name": "North Depot",
        "location": "Ambattur",
        "coordinates": [13.1143, 80.1548],
        "resources": {
            "medical_kits": 5000,
            "food_packets": 25000,
            "water_liters": 250000,
            "shelter_kits": 1000,
            "oxygen_cylinders": 200,
            "vaccines": 2000,
            "surgical_kits": 100
        },
        "vehicles": {
            "trucks": 10,
            "boats": 4,
            "drones": 5,
            "helicopters": 1
        }
    },
    "south_depot": {
        "name": "South Depot",
        "location": "Tambaram",
        "coordinates": [12.9249, 80.1000],
        "resources": {
            "medical_kits": 5000,
            "food_packets": 25000,
            "water_liters": 250000,
            "shelter_kits": 1000,
            "oxygen_cylinders": 200,
            "vaccines": 2000,
            "surgical_kits": 100
        },
        "vehicles": {
            "trucks": 10,
            "boats": 4,
            "drones": 5,
            "helicopters": 1
        }
    }
}

# Zone definitions with coordinates
ZONES = {
    "North": {
        "name": "North Zone",
        "center": [13.15, 80.20],
        "population": 850000,
        "hospitals": 12,
        "critical_infrastructure": ["Power Station A", "Water Treatment Plant"]
    },
    "South": {
        "name": "South Zone", 
        "center": [12.90, 80.15],
        "population": 720000,
        "hospitals": 10,
        "critical_infrastructure": ["Airport", "Railway Hub"]
    },
    "East": {
        "name": "East Zone",
        "center": [13.05, 80.30],
        "population": 650000,
        "hospitals": 8,
        "critical_infrastructure": ["Port", "Industrial Area"]
    },
    "West": {
        "name": "West Zone",
        "center": [13.05, 80.10],
        "population": 580000,
        "hospitals": 7,
        "critical_infrastructure": ["IT Park", "University Campus"]
    },
    "Central": {
        "name": "Central Zone",
        "center": [13.08, 80.27],
        "population": 920000,
        "hospitals": 15,
        "critical_infrastructure": ["Government Complex", "Main Hospital", "Bus Terminus"]
    }
}

# Road network for A* routing
ROAD_NETWORK = {
    "nodes": {
        "Central_Depot": {"coordinates": [13.0827, 80.2707], "type": "depot"},
        "Anna_Salai_Node": {"coordinates": [13.0600, 80.2500], "type": "junction"},
        "OMR_Node": {"coordinates": [12.9500, 80.2400], "type": "junction"},
        "ECR_Node": {"coordinates": [12.9800, 80.2800], "type": "junction"},
        "Mount_Road_Node": {"coordinates": [13.0400, 80.2600], "type": "junction"},
        "Marina_Node": {"coordinates": [13.0500, 80.2900], "type": "junction"},
        "Velachery_Node": {"coordinates": [12.9800, 80.2200], "type": "junction"},
        "Ambattur_Node": {"coordinates": [13.1143, 80.1548], "type": "junction"},
        "Tambaram_Node": {"coordinates": [12.9249, 80.1000], "type": "junction"},
        "Zone_North": {"coordinates": [13.15, 80.20], "type": "zone"},
        "Zone_South": {"coordinates": [12.90, 80.15], "type": "zone"},
        "Zone_East": {"coordinates": [13.05, 80.30], "type": "zone"},
        "Zone_West": {"coordinates": [13.05, 80.10], "type": "zone"},
        "Zone_Central": {"coordinates": [13.08, 80.27], "type": "zone"},
        "Link_Road_East": {"coordinates": [13.06, 80.28], "type": "junction"},
        "Link_Road_West": {"coordinates": [13.06, 80.15], "type": "junction"},
        "Link_Road_North": {"coordinates": [13.12, 80.22], "type": "junction"},
        "Link_Road_South": {"coordinates": [12.95, 80.18], "type": "junction"}
    },
    "edges": [
        {"from": "Central_Depot", "to": "Anna_Salai_Node", "road": "Anna_Salai", "distance": 3.5, "time_min": 10},
        {"from": "Central_Depot", "to": "Zone_Central", "road": "Central_Link", "distance": 1.0, "time_min": 5},
        {"from": "Anna_Salai_Node", "to": "Mount_Road_Node", "road": "Anna_Salai", "distance": 2.5, "time_min": 8},
        {"from": "Anna_Salai_Node", "to": "Zone_Central", "road": "Link_1", "distance": 2.0, "time_min": 6},
        {"from": "Mount_Road_Node", "to": "OMR_Node", "road": "Mount_Road", "distance": 4.0, "time_min": 12},
        {"from": "Mount_Road_Node", "to": "Velachery_Node", "road": "Mount_Road", "distance": 3.0, "time_min": 9},
        {"from": "OMR_Node", "to": "Zone_South", "road": "OMR", "distance": 5.0, "time_min": 15},
        {"from": "OMR_Node", "to": "Velachery_Node", "road": "OMR", "distance": 3.5, "time_min": 10},
        {"from": "OMR_Node", "to": "ECR_Node", "road": "Link_2", "distance": 2.0, "time_min": 6},
        {"from": "ECR_Node", "to": "Zone_East", "road": "ECR", "distance": 4.0, "time_min": 12},
        {"from": "ECR_Node", "to": "Marina_Node", "road": "ECR", "distance": 3.0, "time_min": 9},
        {"from": "Marina_Node", "to": "Zone_East", "road": "Marina", "distance": 2.5, "time_min": 8},
        {"from": "Marina_Node", "to": "Zone_Central", "road": "Link_3", "distance": 2.0, "time_min": 6},
        {"from": "Central_Depot", "to": "Link_Road_East", "road": "Inner_Ring", "distance": 1.5, "time_min": 5},
        {"from": "Link_Road_East", "to": "Zone_East", "road": "Inner_Ring", "distance": 2.0, "time_min": 7},
        {"from": "Central_Depot", "to": "Link_Road_West", "road": "Inner_Ring", "distance": 2.0, "time_min": 6},
        {"from": "Link_Road_West", "to": "Zone_West", "road": "Inner_Ring", "distance": 2.5, "time_min": 8},
        {"from": "Central_Depot", "to": "Link_Road_North", "road": "NH_48", "distance": 4.0, "time_min": 12},
        {"from": "Link_Road_North", "to": "Zone_North", "road": "NH_48", "distance": 3.0, "time_min": 9},
        {"from": "Link_Road_North", "to": "Ambattur_Node", "road": "NH_48", "distance": 2.0, "time_min": 6},
        {"from": "Ambattur_Node", "to": "Zone_North", "road": "Local_1", "distance": 4.0, "time_min": 12},
        {"from": "Velachery_Node", "to": "Link_Road_South", "road": "Velachery_Main", "distance": 3.0, "time_min": 9},
        {"from": "Link_Road_South", "to": "Zone_South", "road": "Local_2", "distance": 3.5, "time_min": 10},
        {"from": "Link_Road_South", "to": "Tambaram_Node", "road": "GST_Road", "distance": 4.0, "time_min": 12},
        {"from": "Tambaram_Node", "to": "Zone_South", "road": "Local_3", "distance": 3.0, "time_min": 9},
        {"from": "Zone_Central", "to": "Link_Road_East", "road": "Link_4", "distance": 1.5, "time_min": 5},
        {"from": "Zone_Central", "to": "Link_Road_West", "road": "Link_5", "distance": 2.0, "time_min": 6}
    ]
}

