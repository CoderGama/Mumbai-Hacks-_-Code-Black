from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class DisasterType(str, Enum):
    FLOOD = "flood"
    CYCLONE = "cyclone"
    EARTHQUAKE = "earthquake"
    HEATWAVE = "heatwave"
    LANDSLIDE = "landslide"
    WILDFIRE = "wildfire"
    MEDICAL_EMERGENCY = "medical_emergency"

class SeverityLabel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    VERY_HIGH = "Very High"
    CRITICAL = "Critical"

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

# ============== Disaster-Specific Input Models ==============

class FloodSpecific(BaseModel):
    water_level_m: float = Field(default=0.5, description="Water level in meters")
    rainfall_mm_24h: float = Field(default=100, description="Rainfall in last 24 hours (mm)")
    inland_or_coastal: str = Field(default="inland", description="inland or coastal")

class CycloneSpecific(BaseModel):
    max_wind_speed_kmph: float = Field(default=120, description="Maximum wind speed in km/h")
    cyclone_translation_speed_kmph: float = Field(default=20, description="Cyclone translation speed in km/h")
    cyclone_direction: str = Field(default="NE", description="Direction of cyclone movement")

class EarthquakeSpecific(BaseModel):
    magnitude: float = Field(default=5.0, description="Earthquake magnitude on Richter scale")
    epicenter_distance_km: float = Field(default=50, description="Distance from epicenter in km")
    building_collapse_ratio: float = Field(default=0.1, description="Ratio of collapsed buildings (0-1)")

class HeatwaveSpecific(BaseModel):
    max_temp_c: float = Field(default=45, description="Maximum temperature in Celsius")
    humidity_pct: float = Field(default=30, description="Humidity percentage")
    duration_days: int = Field(default=3, description="Duration of heatwave in days")

# ============== Available Resources Model ==============

class AvailableResources(BaseModel):
    medical_kits_available: int = Field(default=1000, description="Medical kits available")
    boats_available: int = Field(default=2, description="Boats available")
    drones_available: int = Field(default=2, description="Drones available")
    trucks_available: int = Field(default=5, description="Trucks available")

# ============== Disaster-Specific Container ==============

class DisasterSpecificData(BaseModel):
    flood: Optional[FloodSpecific] = None
    cyclone: Optional[CycloneSpecific] = None
    earthquake: Optional[EarthquakeSpecific] = None
    heatwave: Optional[HeatwaveSpecific] = None

# ============== Main Scenario Input Model ==============

class ScenarioInput(BaseModel):
    """Complete scenario input model matching frontend structure"""
    city: str = Field(default="Chennai", description="City name")
    disaster_type: str = Field(..., description="Type of disaster")
    severity_level: int = Field(..., ge=1, le=5, description="Severity level (1-5)")
    severity_label: str = Field(..., description="Severity label (Low, Moderate, High, Very High, Critical)")
    population_affected: int = Field(..., ge=0, description="Number of people affected")
    zones_impacted: List[str] = Field(..., description="List of impacted zones")
    hospital_load_pct: float = Field(..., ge=0, le=100, description="Hospital load percentage (0-100)")
    blocked_roads: List[str] = Field(default=[], description="List of blocked roads")
    available_resources: AvailableResources = Field(default_factory=AvailableResources)
    disaster_specific: Optional[DisasterSpecificData] = Field(default=None)
    notes: str = Field(default="", description="Additional notes")

# ============== Legacy Request Model (for backward compatibility) ==============

class ScenarioRequest(BaseModel):
    """Legacy model - maps to new structure internally"""
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

# ============== Response Models ==============

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "coordinator"

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

class RouteCoordinate(BaseModel):
    lat: float
    lon: float

class RouteInfo(BaseModel):
    zone: str
    path: List[str]
    path_coordinates: List[List[float]]
    distance_km: float
    time_min: float
    roads: List[str]

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

class ActionItem(BaseModel):
    action: str
    priority: str
    resources: Optional[str] = None
    zones: Optional[str] = None

class SimilarScenarioSummary(BaseModel):
    id: str
    distance: float
    severity: int
    hospital_load: float
    outcome: Optional[str] = None

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
    # New fields for enhanced routing
    primary_route_coordinates: Optional[List[List[float]]] = None
    # ML model interpretability
    ml_interpretability: Optional[dict] = None

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

# touch update 11/29/2025 12:45:26
