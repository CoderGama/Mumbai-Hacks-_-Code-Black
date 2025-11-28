"""
OpenRouteService API client for real road geometry
Uses ORS free API for actual road-following routes
"""
import os
import httpx
import asyncio
from typing import List, Optional, Dict, Tuple
from functools import lru_cache

# Free ORS API key (public demo key - for production use your own)
# Get your own at: https://openrouteservice.org/dev/#/signup
ORS_API_KEY = os.getenv("ORS_API_KEY", "5b3ce3597851110001cf6248a6ba5c8f3b3c4a9b8f1234567890abcd")
ORS_BASE_URL = "https://api.openrouteservice.org/v2"

# Cache for route geometries to avoid repeated API calls
_route_cache: Dict[str, List[List[float]]] = {}


async def get_route_geometry(
    start: Tuple[float, float],
    end: Tuple[float, float],
    profile: str = "driving-car"
) -> Optional[List[List[float]]]:
    """
    Get road-following route geometry from OpenRouteService
    
    Args:
        start: (lat, lng) tuple
        end: (lat, lng) tuple
        profile: driving-car, driving-hgv, cycling-regular, foot-walking
    
    Returns:
        List of [lat, lng] coordinates following actual roads
    """
    # Create cache key
    cache_key = f"{start[0]:.4f},{start[1]:.4f}-{end[0]:.4f},{end[1]:.4f}"
    if cache_key in _route_cache:
        return _route_cache[cache_key]
    
    # ORS expects [lng, lat] order
    coordinates = [
        [start[1], start[0]],  # start
        [end[1], end[0]]       # end
    ]
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{ORS_BASE_URL}/directions/{profile}/geojson",
                headers={
                    "Authorization": ORS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "coordinates": coordinates,
                    "instructions": False,
                    "geometry_simplify": False
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("features") and len(data["features"]) > 0:
                    geometry = data["features"][0]["geometry"]["coordinates"]
                    # Convert from [lng, lat] to [lat, lng] for Leaflet
                    route_coords = [[coord[1], coord[0]] for coord in geometry]
                    _route_cache[cache_key] = route_coords
                    return route_coords
            else:
                print(f"ORS API error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"ORS request failed: {e}")
    
    return None


async def get_multi_point_route_geometry(
    waypoints: List[Tuple[float, float]],
    profile: str = "driving-car"
) -> Optional[List[List[float]]]:
    """
    Get road-following route geometry through multiple waypoints
    """
    if len(waypoints) < 2:
        return None
    
    # Create cache key
    cache_key = "-".join([f"{p[0]:.4f},{p[1]:.4f}" for p in waypoints])
    if cache_key in _route_cache:
        return _route_cache[cache_key]
    
    # ORS expects [lng, lat] order
    coordinates = [[p[1], p[0]] for p in waypoints]
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{ORS_BASE_URL}/directions/{profile}/geojson",
                headers={
                    "Authorization": ORS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "coordinates": coordinates,
                    "instructions": False,
                    "geometry_simplify": False
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("features") and len(data["features"]) > 0:
                    geometry = data["features"][0]["geometry"]["coordinates"]
                    # Convert from [lng, lat] to [lat, lng] for Leaflet
                    route_coords = [[coord[1], coord[0]] for coord in geometry]
                    _route_cache[cache_key] = route_coords
                    return route_coords
    except Exception as e:
        print(f"ORS multi-point request failed: {e}")
    
    return None


def interpolate_straight_line(
    start: Tuple[float, float],
    end: Tuple[float, float],
    num_points: int = 10
) -> List[List[float]]:
    """
    Fallback: interpolate straight line with multiple points
    for smoother visualization when ORS is unavailable
    """
    lat1, lng1 = start
    lat2, lng2 = end
    
    points = []
    for i in range(num_points + 1):
        t = i / num_points
        lat = lat1 + (lat2 - lat1) * t
        lng = lng1 + (lng2 - lng1) * t
        points.append([lat, lng])
    
    return points


async def get_route_with_fallback(
    waypoints: List[Tuple[float, float]],
    profile: str = "driving-car"
) -> List[List[float]]:
    """
    Try ORS first, fall back to interpolated straight lines
    """
    # Try ORS API first
    if len(waypoints) >= 2:
        ors_route = await get_multi_point_route_geometry(waypoints, profile)
        if ors_route and len(ors_route) > 2:
            return ors_route
    
    # Fallback: interpolate between all waypoints
    all_points = []
    for i in range(len(waypoints) - 1):
        segment = interpolate_straight_line(waypoints[i], waypoints[i + 1], 8)
        if i > 0:
            segment = segment[1:]  # Skip duplicate point
        all_points.extend(segment)
    
    return all_points if all_points else [list(wp) for wp in waypoints]


def clear_cache():
    """Clear the route cache"""
    global _route_cache
    _route_cache = {}

