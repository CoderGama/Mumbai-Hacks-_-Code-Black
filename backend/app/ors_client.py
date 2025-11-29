"""
OSRM (Open Source Routing Machine) client for real road geometry
Uses free public OSRM demo server - no API key required!
"""
import httpx
import polyline
from typing import List, Optional, Dict, Tuple

# OSRM public demo server (free, no API key needed)
OSRM_BASE_URL = "https://router.project-osrm.org"

# Cache for route geometries to avoid repeated API calls
_route_cache: Dict[str, List[List[float]]] = {}

# Enable debug logging
DEBUG = True

def _log(msg: str):
    if DEBUG:
        print(f"[OSRM] {msg}")


async def get_route_geometry(
    start: Tuple[float, float],
    end: Tuple[float, float],
    profile: str = "driving"
) -> Optional[List[List[float]]]:
    """
    Get road-following route geometry from OSRM
    
    Args:
        start: (lat, lng) tuple
        end: (lat, lng) tuple
        profile: driving, walking, cycling
    
    Returns:
        List of [lat, lng] coordinates following actual roads
    """
    # Create cache key
    cache_key = f"{start[0]:.5f},{start[1]:.5f}-{end[0]:.5f},{end[1]:.5f}"
    if cache_key in _route_cache:
        _log(f"Cache hit for route: {cache_key}")
        return _route_cache[cache_key]
    
    # OSRM expects lng,lat order in URL
    coords = f"{start[1]},{start[0]};{end[1]},{end[0]}"
    url = f"{OSRM_BASE_URL}/route/v1/{profile}/{coords}"
    _log(f"Requesting: {url}")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                params={
                    "overview": "full",
                    "geometries": "polyline"
                }
            )
            
            _log(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    # Decode polyline to coordinates
                    encoded = data["routes"][0]["geometry"]
                    decoded = polyline.decode(encoded)
                    # decoded is already in [lat, lng] format
                    route_coords = [list(coord) for coord in decoded]
                    _route_cache[cache_key] = route_coords
                    _log(f"SUCCESS: Got {len(route_coords)} points following real roads")
                    return route_coords
                else:
                    _log(f"OSRM returned no routes: {data.get('code')}")
            else:
                _log(f"OSRM API error: {response.status_code} - {response.text[:200]}")
    except Exception as e:
        _log(f"OSRM request failed: {e}")
    
    return None


async def get_multi_point_route_geometry(
    waypoints: List[Tuple[float, float]],
    profile: str = "driving"
) -> Optional[List[List[float]]]:
    """
    Get road-following route geometry through multiple waypoints
    """
    if len(waypoints) < 2:
        _log(f"Not enough waypoints: {len(waypoints)}")
        return None
    
    # Create cache key
    cache_key = "-".join([f"{p[0]:.5f},{p[1]:.5f}" for p in waypoints])
    if cache_key in _route_cache:
        _log(f"Cache hit for multi-point route ({len(waypoints)} waypoints)")
        return _route_cache[cache_key]
    
    # OSRM expects lng,lat;lng,lat;... format
    coords = ";".join([f"{p[1]},{p[0]}" for p in waypoints])
    url = f"{OSRM_BASE_URL}/route/v1/{profile}/{coords}"
    _log(f"Multi-point request ({len(waypoints)} waypoints): {url[:100]}...")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:  # Short timeout - fall back quickly
            response = await client.get(
                url,
                params={
                    "overview": "full",
                    "geometries": "polyline"
                }
            )
            
            _log(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("code") == "Ok" and data.get("routes"):
                    # Decode polyline to coordinates
                    encoded = data["routes"][0]["geometry"]
                    decoded = polyline.decode(encoded)
                    route_coords = [list(coord) for coord in decoded]
                    _route_cache[cache_key] = route_coords
                    _log(f"SUCCESS: Got {len(route_coords)} points for {len(waypoints)} waypoints (following real roads)")
                    return route_coords
                else:
                    _log(f"OSRM returned no routes: {data.get('code')}, message: {data.get('message', 'N/A')}")
            else:
                _log(f"OSRM API error: {response.status_code}")
    except Exception as e:
        _log(f"OSRM multi-point request failed: {e}")
    
    return None


def interpolate_curved_path(
    start: Tuple[float, float],
    end: Tuple[float, float],
    num_points: int = 15,
    curve_factor: float = 0.15
) -> List[List[float]]:
    """
    Create a curved path between two points to simulate road-like routing.
    Uses quadratic bezier curve with a control point offset perpendicular to the line.
    """
    import math
    
    lat1, lng1 = start
    lat2, lng2 = end
    
    # Calculate midpoint
    mid_lat = (lat1 + lat2) / 2
    mid_lng = (lng1 + lng2) / 2
    
    # Calculate perpendicular offset for curve control point
    dx = lng2 - lng1
    dy = lat2 - lat1
    length = math.sqrt(dx*dx + dy*dy)
    
    if length > 0:
        # Perpendicular direction
        perp_x = -dy / length
        perp_y = dx / length
        
        # Offset the control point (alternate direction based on coordinates to vary curves)
        direction = 1 if (lat1 + lng1) % 0.02 > 0.01 else -1
        offset = length * curve_factor * direction
        
        ctrl_lat = mid_lat + perp_y * offset
        ctrl_lng = mid_lng + perp_x * offset
    else:
        ctrl_lat, ctrl_lng = mid_lat, mid_lng
    
    # Generate quadratic bezier curve points
    points = []
    for i in range(num_points + 1):
        t = i / num_points
        # Quadratic bezier formula: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
        lat = (1-t)**2 * lat1 + 2*(1-t)*t * ctrl_lat + t**2 * lat2
        lng = (1-t)**2 * lng1 + 2*(1-t)*t * ctrl_lng + t**2 * lng2
        points.append([lat, lng])
    
    return points


def create_road_like_path(waypoints: List[Tuple[float, float]]) -> List[List[float]]:
    """
    Create a smooth, road-like path through waypoints using curved interpolation.
    This provides a much better visual than straight lines.
    """
    if len(waypoints) < 2:
        return [list(wp) for wp in waypoints]
    
    all_points = []
    for i in range(len(waypoints) - 1):
        # Use more points for longer segments
        start = waypoints[i]
        end = waypoints[i + 1]
        
        # Calculate distance to determine number of interpolation points
        import math
        dist = math.sqrt((end[0]-start[0])**2 + (end[1]-start[1])**2)
        num_points = max(10, min(25, int(dist * 500)))  # Scale with distance
        
        segment = interpolate_curved_path(start, end, num_points)
        if i > 0:
            segment = segment[1:]  # Skip duplicate point
        all_points.extend(segment)
    
    _log(f"Created smooth path with {len(all_points)} points (curved fallback)")
    return all_points


async def get_route_with_fallback(
    waypoints: List[Tuple[float, float]],
    profile: str = "driving"
) -> List[List[float]]:
    """
    Try OSRM first, fall back to smooth curved paths
    """
    # Try OSRM API first (with short timeout to fail fast)
    if len(waypoints) >= 2:
        try:
            osrm_route = await get_multi_point_route_geometry(waypoints, profile)
            if osrm_route and len(osrm_route) > 2:
                return osrm_route
        except Exception as e:
            _log(f"OSRM failed, using curved fallback: {e}")
    
    # Fallback: create smooth curved path (looks much better than straight lines)
    _log("Using curved path fallback (OSRM unavailable)")
    return create_road_like_path(waypoints)


def clear_cache():
    """Clear the route cache"""
    global _route_cache
    _route_cache = {}

