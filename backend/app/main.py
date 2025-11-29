"""
ReliefRoute Backend API
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List, Optional
import uuid
import random

from .models import (
    LoginRequest, SignupRequest, UserResponse,
    ScenarioRequest, ScenarioInput, DispatchRequest, DecisionActionRequest,
    ZoneResponse, RouteResponse, InventoryResponse, 
    DecisionResponse, AgentResponse, ActivityLog
)
from .scenarios import DEPOT_INVENTORY, ZONES, CHENNAI_SCENARIOS
from .agent import agent
from .routing import a_star_route

app = FastAPI(
    title="ReliefRoute API",
    description="Autonomous Disaster Relief Logistics System",
    version="1.0.0"
)

#Cutom endpoint to check if the backend is running
@app.get("/")
async def root():
    return {"message": "ReliefRoute Backend Running"}

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (would be database in production)
users_db = {
    "admin@reliefroute.org": {
        "id": "user_001",
        "name": "Admin User",
        "email": "admin@reliefroute.org",
        "password": "admin123",
        "role": "admin"
    }
}

active_decisions = []
activity_logs = []
active_routes = []
active_zones = []

def add_activity_log(event_type: str, description: str, details: dict = None):
    log = ActivityLog(
        id=str(uuid.uuid4())[:8],
        timestamp=datetime.now().isoformat(),
        event_type=event_type,
        description=description,
        details=details or {}
    )
    activity_logs.insert(0, log)
    if len(activity_logs) > 100:
        activity_logs.pop()
    return log

# Initialize with some sample data
def initialize_sample_data():
    global active_zones, active_routes
    
    # Sample active disaster zones
    active_zones = [
        ZoneResponse(
            id="zone_001",
            name="East Zone",
            disaster_type="flood",
            severity="high",
            population_affected=15000,
            supply_coverage={
                "food": 75,
                "water": 80,
                "medical": 60,
                "shelter": 50
            },
            updated_at=datetime.now().isoformat()
        ),
        ZoneResponse(
            id="zone_002",
            name="South Zone",
            disaster_type="flood",
            severity="critical",
            population_affected=25000,
            supply_coverage={
                "food": 45,
                "water": 50,
                "medical": 35,
                "shelter": 40
            },
            updated_at=(datetime.now() - timedelta(minutes=15)).isoformat()
        ),
        ZoneResponse(
            id="zone_003",
            name="Central Zone",
            disaster_type="flood",
            severity="moderate",
            population_affected=8000,
            supply_coverage={
                "food": 85,
                "water": 90,
                "medical": 80,
                "shelter": 75
            },
            updated_at=(datetime.now() - timedelta(minutes=30)).isoformat()
        )
    ]
    
    # Sample active routes
    active_routes = [
        RouteResponse(
            id="route_001",
            vehicle_id="TRK-001",
            vehicle_type="truck",
            from_location="Central Depot",
            to_location="East Zone",
            eta="45 min",
            status="on_time",
            path=["Central_Depot", "Anna_Salai_Node", "Link_Road_East", "Zone_East"]
        ),
        RouteResponse(
            id="route_002",
            vehicle_id="TRK-002",
            vehicle_type="truck",
            from_location="Central Depot",
            to_location="South Zone",
            eta="1h 15min",
            status="delayed",
            path=["Central_Depot", "Mount_Road_Node", "Velachery_Node", "Link_Road_South", "Zone_South"]
        ),
        RouteResponse(
            id="route_003",
            vehicle_id="BOAT-001",
            vehicle_type="boat",
            from_location="Marina",
            to_location="East Zone",
            eta="30 min",
            status="on_time",
            path=["Marina_Node", "Zone_East"]
        )
    ]
    
    # Add initial activity logs
    add_activity_log("system", "ReliefRoute system initialized", {"version": "1.0.0"})
    add_activity_log("alert", "Flood warning issued for Chennai metropolitan area", {"severity": "high"})

initialize_sample_data()

# ============== Authentication Endpoints ==============

@app.post("/api/auth/login", response_model=UserResponse)
async def login(request: LoginRequest):
    user = users_db.get(request.email)
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    add_activity_log("auth", f"User {user['name']} logged in", {"user_id": user["id"]})
    
    return UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        token=f"token_{uuid.uuid4().hex[:16]}"
    )

@app.post("/api/auth/signup", response_model=UserResponse)
async def signup(request: SignupRequest):
    if request.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:6]}"
    users_db[request.email] = {
        "id": user_id,
        "name": request.name,
        "email": request.email,
        "password": request.password,
        "role": request.role
    }
    
    add_activity_log("auth", f"New user registered: {request.name}", {"user_id": user_id})
    
    return UserResponse(
        id=user_id,
        name=request.name,
        email=request.email,
        role=request.role,
        token=f"token_{uuid.uuid4().hex[:16]}"
    )

@app.post("/api/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

# ============== Dashboard Endpoints ==============

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    total_population = sum(z.population_affected for z in active_zones)
    
    return {
        "active_disasters": len(active_zones),
        "affected_population": total_population,
        "active_routes": len(active_routes),
        "average_response_time": "47 min",
        "pending_decisions": len([d for d in active_decisions if d.status == "pending"]),
        "supply_status": {
            "medical_kits": {"available": 20000, "deployed": 5500},
            "food_packets": {"available": 100000, "deployed": 35000},
            "water_liters": {"available": 1000000, "deployed": 450000}
        }
    }

@app.get("/api/zones", response_model=List[ZoneResponse])
async def get_zones():
    return active_zones

@app.get("/api/routes", response_model=List[RouteResponse])
async def get_routes():
    return active_routes

@app.get("/api/inventory", response_model=List[InventoryResponse])
async def get_inventory():
    inventory_list = []
    for depot_id, depot in DEPOT_INVENTORY.items():
        inventory_list.append(InventoryResponse(
            id=depot_id,
            depot_name=depot["name"],
            location=depot["location"],
            resources={**depot["resources"], **depot["vehicles"]}
        ))
    return inventory_list

@app.get("/api/activity-logs", response_model=List[ActivityLog])
async def get_activity_logs(limit: int = 20):
    return activity_logs[:limit]

# ============== Agent Endpoints ==============

def convert_to_scenario_input(data) -> ScenarioInput:
    """Convert legacy ScenarioRequest or dict to ScenarioInput"""
    if isinstance(data, ScenarioInput):
        return data
    elif isinstance(data, ScenarioRequest):
        # Convert legacy format
        severity_labels = {1: "Low", 2: "Moderate", 3: "High", 4: "Very High", 5: "Critical"}
        return ScenarioInput(
            city="Chennai",
            disaster_type=data.disaster_type,
            severity_level=data.severity,
            severity_label=severity_labels.get(data.severity, "Moderate"),
            population_affected=data.population_affected,
            zones_impacted=data.zones_affected,
            hospital_load_pct=data.hospital_load if data.hospital_load > 1 else data.hospital_load * 100,
            blocked_roads=data.blocked_roads or []
        )
    else:
        # Assume it's a dict from frontend
        if "severity_level" in data:
            return ScenarioInput(**data)
        else:
            # Legacy dict format
            severity_labels = {1: "Low", 2: "Moderate", 3: "High", 4: "Very High", 5: "Critical"}
            return ScenarioInput(
                city=data.get("city", "Chennai"),
                disaster_type=data["disaster_type"],
                severity_level=data.get("severity_level", data.get("severity", 3)),
                severity_label=data.get("severity_label", severity_labels.get(data.get("severity", 3), "Moderate")),
                population_affected=data["population_affected"],
                zones_impacted=data.get("zones_impacted", data.get("zones_affected", [])),
                hospital_load_pct=data.get("hospital_load_pct", data.get("hospital_load", 0)),
                blocked_roads=data.get("blocked_roads", []),
                available_resources=data.get("available_resources", {}),
                disaster_specific=data.get("disaster_specific"),
                notes=data.get("notes", "")
            )

@app.post("/api/agent/run", response_model=AgentResponse)
async def run_agent(request: ScenarioInput | ScenarioRequest):
    """Main agent endpoint - processes scenario and returns decision"""
    
    # Convert to ScenarioInput format
    scenario_input = convert_to_scenario_input(request)
    
    add_activity_log(
        "scenario",
        f"New {scenario_input.disaster_type} scenario submitted",
        {
            "severity": scenario_input.severity_level,
            "population": scenario_input.population_affected,
            "zones": scenario_input.zones_impacted
        }
    )
    
    # Run the agent with new format
    decision = agent.run_from_input(scenario_input)
    active_decisions.insert(0, decision)
    
    # Update active zones based on decision
    for zone_name in scenario_input.zones_impacted:
        existing = next((z for z in active_zones if zone_name in z.name), None)
        if not existing:
            severity_map = {1: "low", 2: "moderate", 3: "moderate", 4: "high", 5: "critical"}
            new_zone = ZoneResponse(
                id=f"zone_{uuid.uuid4().hex[:6]}",
                name=f"{zone_name} Zone",
                disaster_type=scenario_input.disaster_type,
                severity=severity_map.get(scenario_input.severity_level, "moderate"),
                population_affected=scenario_input.population_affected // len(scenario_input.zones_impacted),
                supply_coverage={
                    "food": random.randint(40, 80),
                    "water": random.randint(40, 80),
                    "medical": random.randint(30, 70),
                    "shelter": random.randint(30, 70)
                },
                updated_at=datetime.now().isoformat()
            )
            active_zones.append(new_zone)
    
    # Add route based on decision
    if decision.selected_routes:
        for route_info in decision.selected_routes:
            new_route = RouteResponse(
                id=f"route_{uuid.uuid4().hex[:6]}",
                vehicle_id=f"TRK-{random.randint(100, 999)}",
                vehicle_type="truck",
                from_location="Central Depot",
                to_location=f"{route_info['zone']} Zone",
                eta=f"{route_info['time_min']:.0f} min",
                status="on_time",
                path=route_info["path"]
            )
            active_routes.insert(0, new_route)
    
    add_activity_log(
        "decision",
        f"Agent decision generated: {decision.risk_level} risk",
        {
            "decision_id": decision.id,
            "routes": len(decision.selected_routes),
            "resources": len(decision.resources_dispatched)
        }
    )
    
    # Build dashboard updates
    total_population = sum(z.population_affected for z in active_zones)
    dashboard_updates = {
        "active_disasters": len(active_zones),
        "affected_population": total_population,
        "active_routes": len(active_routes),
        "new_zones": scenario_input.zones_impacted,
        "risk_level": decision.risk_level
    }
    
    return AgentResponse(
        success=True,
        decision=decision,
        dashboard_updates=dashboard_updates
    )

@app.get("/api/decisions", response_model=List[DecisionResponse])
async def get_decisions():
    return active_decisions

@app.post("/api/decisions/{decision_id}/action")
async def decision_action(decision_id: str, request: DecisionActionRequest):
    """Handle decision approval, abort, or modification"""
    decision = next((d for d in active_decisions if d.id == decision_id), None)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    if request.action == "approve":
        decision.status = "approved"
        add_activity_log("decision", f"Decision {decision_id} approved", {"action": "approve"})
        agent.update_learning_weights(decision, "approved")
    elif request.action == "abort":
        decision.status = "aborted"
        add_activity_log("override", f"Decision {decision_id} aborted by supervisor", {"action": "abort"})
        agent.update_learning_weights(decision, "aborted")
    elif request.action == "modify":
        decision.status = "modified"
        add_activity_log("decision", f"Decision {decision_id} modified", {"action": "modify"})
    
    return {"success": True, "decision_id": decision_id, "new_status": decision.status}

# ============== Dispatch Endpoints ==============

@app.post("/api/dispatch")
async def dispatch_vehicle(request: DispatchRequest):
    """Manually dispatch a vehicle"""
    
    # Find route to destination
    zone_node = f"Zone_{request.destination_zone}"
    route = a_star_route("Central_Depot", zone_node, [])
    
    if not route:
        raise HTTPException(status_code=400, detail="No route found to destination")
    
    vehicle_id = f"{request.vehicle_type.upper()[:3]}-{random.randint(100, 999)}"
    
    new_route = RouteResponse(
        id=f"route_{uuid.uuid4().hex[:6]}",
        vehicle_id=vehicle_id,
        vehicle_type=request.vehicle_type,
        from_location="Central Depot",
        to_location=f"{request.destination_zone} Zone",
        eta=f"{route['total_time_min']:.0f} min",
        status="on_time",
        path=route["path"]
    )
    active_routes.insert(0, new_route)
    
    add_activity_log(
        "dispatch",
        f"Vehicle {vehicle_id} dispatched to {request.destination_zone}",
        {
            "vehicle_type": request.vehicle_type,
            "cargo": request.cargo_description,
            "route": route["path"]
        }
    )
    
    return {
        "success": True,
        "vehicle_id": vehicle_id,
        "route": route,
        "eta": f"{route['total_time_min']:.0f} min"
    }

# ============== Map / Routing Endpoints ==============

@app.get("/api/map/routes")
async def get_map_routes():
    """Get all route data for map visualization with real road geometry"""
    from .scenarios import ROAD_NETWORK
    from .ors_client import get_route_with_fallback
    
    routes_with_coords = []
    for route in active_routes:
        # Get waypoints from path nodes
        waypoints = []
        for node in route.path:
            if node in ROAD_NETWORK["nodes"]:
                coords = ROAD_NETWORK["nodes"][node]["coordinates"]
                waypoints.append(tuple(coords))
        
        # Try to get real road geometry
        if len(waypoints) >= 2:
            try:
                path_coords = await get_route_with_fallback(waypoints)
            except Exception as e:
                print(f"Failed to get road geometry: {e}")
                path_coords = [list(wp) for wp in waypoints]
        else:
            path_coords = [list(wp) for wp in waypoints]
        
        routes_with_coords.append({
            **route.dict(),
            "path_coordinates": path_coords
        })
    
    return {
        "routes": routes_with_coords,
        "depots": [
            {
                "id": depot_id,
                "name": depot["name"],
                "coordinates": depot["coordinates"]
            }
            for depot_id, depot in DEPOT_INVENTORY.items()
        ],
        "zones": [
            {
                "name": zone_name,
                "coordinates": zone_data["center"]
            }
            for zone_name, zone_data in ZONES.items()
        ]
    }

@app.get("/api/map/calculate-route")
async def calculate_route(start: str = "Central_Depot", end: str = "Zone_East", blocked: str = ""):
    """Calculate a route between two points"""
    blocked_roads = [r.strip() for r in blocked.split(",") if r.strip()] if blocked else []
    
    route = a_star_route(start, end, blocked_roads)
    if not route:
        raise HTTPException(status_code=404, detail="No route found")
    
    return route

# ============== Scenario Presets ==============

@app.get("/api/scenarios/presets")
async def get_scenario_presets():
    """Get quick scenario presets"""
    return [
        {
            "id": "flash_flood",
            "name": "Flash Flood",
            "icon": "🌊",
            "config": {
                "disaster_type": "flood",
                "severity": 4,
                "population_affected": 25000,
                "zones_affected": ["East", "Central"],
                "hospital_load": 75,
                "blocked_roads": ["OMR", "ECR"]
            }
        },
        {
            "id": "road_block",
            "name": "Road Block",
            "icon": "🚧",
            "config": {
                "disaster_type": "flood",
                "severity": 2,
                "population_affected": 10000,
                "zones_affected": ["South"],
                "hospital_load": 45,
                "blocked_roads": ["Anna_Salai", "Mount_Road"]
            }
        },
        {
            "id": "medical_emergency",
            "name": "Medical Emergency",
            "icon": "🏥",
            "config": {
                "disaster_type": "medical_emergency",
                "severity": 5,
                "population_affected": 5000,
                "zones_affected": ["Central"],
                "hospital_load": 95,
                "blocked_roads": []
            }
        },
        {
            "id": "cyclone_alert",
            "name": "Cyclone Alert",
            "icon": "🌀",
            "config": {
                "disaster_type": "cyclone",
                "severity": 4,
                "population_affected": 75000,
                "zones_affected": ["East", "South", "Central"],
                "hospital_load": 70,
                "blocked_roads": ["ECR", "Marina"]
            }
        },
        {
            "id": "heatwave",
            "name": "Heatwave",
            "icon": "🔥",
            "config": {
                "disaster_type": "heatwave",
                "severity": 4,
                "population_affected": 100000,
                "zones_affected": ["North", "Central", "West"],
                "hospital_load": 80,
                "blocked_roads": []
            }
        },
        {
            "id": "earthquake",
            "name": "Earthquake",
            "icon": "🌍",
            "config": {
                "disaster_type": "earthquake",
                "severity": 5,
                "population_affected": 45000,
                "zones_affected": ["Central", "West", "South"],
                "hospital_load": 92,
                "blocked_roads": ["Anna_Salai", "Mount_Road"]
            }
        }
    ]

# ============== ML Model Endpoints ==============

@app.post("/api/ml/train")
async def train_ml_models():
    """Train ML models from historical scenarios"""
    try:
        from .ml_models import train_models
        results = train_models()
        return {
            "success": True,
            "results": results,
            "message": "Models trained successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Model training failed"
        }

@app.get("/api/ml/interpretability/{decision_id}")
async def get_ml_interpretability(decision_id: str):
    """Get ML model feature importance for a decision"""
    decision = next((d for d in active_decisions if d.id == decision_id), None)
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    if decision.ml_interpretability:
        return {
            "decision_id": decision_id,
            "interpretability": decision.ml_interpretability
        }
    else:
        return {
            "decision_id": decision_id,
            "interpretability": None,
            "message": "No ML interpretability data available (rule-based decision)"
        }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# touch update 11/29/2025 12:45:26
