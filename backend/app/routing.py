"""
A* routing algorithm for ReliefRoute
"""
import heapq
import math
from typing import List, Dict, Tuple, Optional, Set
from .scenarios import ROAD_NETWORK

def haversine_distance(coord1: List[float], coord2: List[float]) -> float:
    """Calculate distance between two coordinates in km"""
    R = 6371  # Earth's radius in km
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def build_graph(blocked_roads: List[str] = None) -> Dict:
    """Build adjacency list from road network, excluding blocked roads"""
    if blocked_roads is None:
        blocked_roads = []
    
    blocked_set = set(blocked_roads)
    graph = {}
    
    # Initialize all nodes
    for node_id in ROAD_NETWORK["nodes"]:
        graph[node_id] = []
    
    # Add edges (bidirectional)
    for edge in ROAD_NETWORK["edges"]:
        if edge["road"] not in blocked_set:
            # Forward edge
            graph[edge["from"]].append({
                "to": edge["to"],
                "road": edge["road"],
                "distance": edge["distance"],
                "time": edge["time_min"]
            })
            # Backward edge
            graph[edge["to"]].append({
                "to": edge["from"],
                "road": edge["road"],
                "distance": edge["distance"],
                "time": edge["time_min"]
            })
    
    return graph

def a_star_route(
    start: str,
    goal: str,
    blocked_roads: List[str] = None,
    optimize_for: str = "time"  # "time" or "distance"
) -> Optional[Dict]:
    """
    A* pathfinding algorithm
    Returns: dict with path, total_distance, total_time, roads_used
    """
    if blocked_roads is None:
        blocked_roads = []
    
    graph = build_graph(blocked_roads)
    nodes = ROAD_NETWORK["nodes"]
    
    if start not in nodes or goal not in nodes:
        return None
    
    goal_coord = nodes[goal]["coordinates"]
    
    def heuristic(node_id: str) -> float:
        """Heuristic: straight-line distance to goal"""
        node_coord = nodes[node_id]["coordinates"]
        dist = haversine_distance(node_coord, goal_coord)
        # Convert to time estimate (assuming 30 km/h average)
        if optimize_for == "time":
            return dist / 30 * 60  # minutes
        return dist
    
    # Priority queue: (f_score, node_id, path, total_cost, roads)
    open_set = [(heuristic(start), start, [start], 0, [])]
    closed_set: Set[str] = set()
    g_scores = {start: 0}
    
    while open_set:
        _, current, path, cost, roads = heapq.heappop(open_set)
        
        if current == goal:
            # Calculate total distance and time
            total_distance = 0
            total_time = 0
            for edge_info in roads:
                total_distance += edge_info["distance"]
                total_time += edge_info["time"]
            
            return {
                "path": path,
                "roads_used": [r["road"] for r in roads],
                "total_distance_km": round(total_distance, 2),
                "total_time_min": round(total_time, 1),
                "path_coordinates": [nodes[n]["coordinates"] for n in path]
            }
        
        if current in closed_set:
            continue
        
        closed_set.add(current)
        
        for neighbor in graph.get(current, []):
            if neighbor["to"] in closed_set:
                continue
            
            # Calculate new cost
            if optimize_for == "time":
                new_cost = cost + neighbor["time"]
            else:
                new_cost = cost + neighbor["distance"]
            
            if neighbor["to"] not in g_scores or new_cost < g_scores[neighbor["to"]]:
                g_scores[neighbor["to"]] = new_cost
                f_score = new_cost + heuristic(neighbor["to"])
                new_path = path + [neighbor["to"]]
                new_roads = roads + [neighbor]
                heapq.heappush(open_set, (f_score, neighbor["to"], new_path, new_cost, new_roads))
    
    return None  # No path found

def find_routes_to_zones(
    start: str,
    zones: List[str],
    blocked_roads: List[str] = None
) -> Dict[str, Optional[Dict]]:
    """Find routes from start to multiple zones"""
    routes = {}
    for zone in zones:
        zone_node = f"Zone_{zone}"
        route = a_star_route(start, zone_node, blocked_roads)
        routes[zone] = route
    return routes

def find_alternative_route(
    start: str,
    goal: str,
    primary_roads: List[str],
    blocked_roads: List[str] = None
) -> Optional[Dict]:
    """Find alternative route avoiding primary route roads"""
    if blocked_roads is None:
        blocked_roads = []
    
    # Block both the original blocked roads and primary route roads
    all_blocked = list(set(blocked_roads + primary_roads))
    return a_star_route(start, goal, all_blocked)

