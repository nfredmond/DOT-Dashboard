#!/usr/bin/env python
"""
Network analysis module for Planning Manager
"""
import json
import os
import networkx as nx
import numpy as np
from typing import Dict, List, Tuple, Any

def create_network_from_geojson(geojson_path: str) -> nx.Graph:
    """
    Create a NetworkX graph from a GeoJSON file of linestrings
    
    Args:
        geojson_path: Path to the GeoJSON file
        
    Returns:
        A NetworkX graph
    """
    if not os.path.exists(geojson_path):
        raise FileNotFoundError(f"GeoJSON file not found: {geojson_path}")
    
    # Load GeoJSON
    with open(geojson_path, 'r') as f:
        geojson_data = json.load(f)
    
    # Create graph
    G = nx.Graph()
    
    # Add edges from LineString features
    for feature in geojson_data.get('features', []):
        if feature.get('geometry', {}).get('type') == 'LineString':
            coords = feature['geometry']['coordinates']
            properties = feature.get('properties', {})
            
            # Add all segments as edges
            for i in range(len(coords) - 1):
                from_node = tuple(coords[i])
                to_node = tuple(coords[i + 1])
                
                # Calculate edge length (Euclidean distance)
                length = np.sqrt(
                    (from_node[0] - to_node[0])**2 + 
                    (from_node[1] - to_node[1])**2
                )
                
                # Add edge with properties
                G.add_edge(
                    from_node, 
                    to_node, 
                    length=length,
                    **properties
                )
    
    return G

def calculate_shortest_paths(G: nx.Graph, source_coords: Tuple[float, float]) -> Dict[Tuple[float, float], float]:
    """
    Calculate shortest paths from a source point to all other nodes
    
    Args:
        G: NetworkX graph
        source_coords: Source coordinates (longitude, latitude)
        
    Returns:
        Dictionary mapping node coordinates to shortest path distances
    """
    # Find closest node to source coordinates if source is not in graph
    if source_coords not in G.nodes:
        source_coords = find_closest_node(G, source_coords)
    
    # Calculate shortest paths using Dijkstra's algorithm
    shortest_paths = nx.single_source_dijkstra_path_length(G, source_coords, weight='length')
    
    return shortest_paths

def find_closest_node(G: nx.Graph, coords: Tuple[float, float]) -> Tuple[float, float]:
    """
    Find the node in graph G that is closest to the given coordinates
    
    Args:
        G: NetworkX graph
        coords: Coordinates (longitude, latitude)
        
    Returns:
        Coordinates of the closest node
    """
    nodes = list(G.nodes())
    closest_node = min(
        nodes,
        key=lambda node: (node[0] - coords[0])**2 + (node[1] - coords[1])**2
    )
    return closest_node

def generate_isochrones(G: nx.Graph, source_coords: Tuple[float, float], 
                       time_thresholds: List[float], speed: float = 5.0) -> Dict[str, Any]:
    """
    Generate isochrones (areas reachable within given times) from a source point
    
    Args:
        G: NetworkX graph
        source_coords: Source coordinates (longitude, latitude)
        time_thresholds: List of time thresholds in minutes
        speed: Travel speed in km/minute
        
    Returns:
        GeoJSON FeatureCollection with isochrone polygons
    """
    # Calculate shortest paths
    shortest_paths = calculate_shortest_paths(G, source_coords)
    
    # Convert distances to times based on speed (km/minute)
    times = {node: distance / speed for node, distance in shortest_paths.items()}
    
    # Create isochrone features
    features = []
    
    for threshold in sorted(time_thresholds):
        # Get nodes reachable within this threshold
        reachable_nodes = [node for node, time in times.items() if time <= threshold]
        
        if len(reachable_nodes) < 3:
            continue  # Need at least 3 points for a polygon
        
        # Convert to GeoJSON Feature with time property
        feature = {
            "type": "Feature",
            "properties": {
                "time": threshold,
                "color": get_color_for_time(threshold, max(time_thresholds))
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    # This is simplified - in a real implementation, use a concave hull algorithm
                    [list(node) for node in reachable_nodes] + [list(reachable_nodes[0])]
                ]
            }
        }
        features.append(feature)
    
    # Create GeoJSON FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    return geojson

def get_color_for_time(time: float, max_time: float) -> str:
    """
    Generate a color based on the time value
    
    Args:
        time: Time value
        max_time: Maximum time value
        
    Returns:
        Color in hex format
    """
    # Normalize time to 0-1 range
    normalized = time / max_time
    
    # Generate color (green to red gradient)
    r = int(255 * normalized)
    g = int(255 * (1 - normalized))
    b = 0
    
    return f"#{r:02x}{g:02x}{b:02x}"

def export_network_to_geojson(G: nx.Graph, output_path: str) -> None:
    """
    Export a NetworkX graph to GeoJSON format
    
    Args:
        G: NetworkX graph
        output_path: Path to save the GeoJSON file
    """
    # Create features for edges
    features = []
    
    for u, v, data in G.edges(data=True):
        # Create LineString feature
        feature = {
            "type": "Feature",
            "properties": {
                **data
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [list(u), list(v)]
            }
        }
        features.append(feature)
    
    # Create GeoJSON FeatureCollection
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    # Save to file
    with open(output_path, 'w') as f:
        json.dump(geojson, f)

if __name__ == "__main__":
    # Example usage
    print("NetworkX analysis module")
    print("This module provides functions for network analysis using NetworkX.")
    print("Import this module in your Python scripts to use its functionality.") 