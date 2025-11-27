from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class DisasterType(str, Enum):
    FLOOD = "flood"
    CYCLONE = "cyclone"
    EARTHQUAKE = "earthquake"
    HEATWAVE = "heatwave"
    HURRICANE = "hurricane"
    LANDSLIDE = "landslide"
    WILDFIRE = "wildfire"
    MEDICAL_EMERGENCY = "medical_emergency"

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class VehicleType(str, Enum):
    TRUCK = "truck"
    BOAT = "boat"
    DRONE = "drone"
    HELICOPTER = "helicopter"

class ZoneStatus(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"

class RouteStatus(str, Enum):
    ON_TIME = "on_time"
    DELAYED = "delayed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Request Models
class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "coordinator"

class ScenarioRequest(BaseModel):
    disaster_type: str
    severity: int  # 1-5
    population_affected: int
    zones_affected: List[str]
    hospital_load: float  # 0-100
    blocked_roads: List[str] = []

class DispatchRequest(BaseModel):
    vehicle_type: str
    destination_zone: str
    cargo_description: str
    supply_items: dict = {}

class DecisionActionRequest(BaseModel):
    decision_id: str
    action: str  # approve, abort, modify

# Response Models
class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    token: Optional[str] = None

class ZoneResponse(BaseModel):
    id: str
    name: str
    disaster_type: str
    severity: str
    population_affected: int
    supply_coverage: dict
    updated_at: str

class RouteResponse(BaseModel):
    id: str
    vehicle_id: str
    vehicle_type: str
    from_location: str
    to_location: str
    eta: str
    status: str
    path: List[str] = []

class InventoryResponse(BaseModel):
    id: str
    depot_name: str
    location: str
    resources: dict

class DecisionResponse(BaseModel):
    id: str
    timestamp: str
    scenario_summary: str
    risk_level: str
    selected_routes: List[dict]
    resources_dispatched: List[dict]
    recommended_actions: List[str]
    status: str  # pending, approved, aborted
    weather_snapshot: dict
    supply_gap: int
    estimated_coverage: float
    similar_scenarios: List[dict]

class AgentResponse(BaseModel):
    success: bool
    decision: DecisionResponse
    dashboard_updates: dict

class ActivityLog(BaseModel):
    id: str
    timestamp: str
    event_type: str
    description: str
    details: dict = {}

