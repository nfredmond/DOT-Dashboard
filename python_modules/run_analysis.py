#!/usr/bin/env python
"""
Script for running network analysis from API calls
"""
import sys
import json
import os
import traceback
from typing import Dict, Any

# Import the network analysis module
try:
    from network_analysis import (
        create_network_from_geojson,
        generate_isochrones,
        export_network_to_geojson
    )
except ImportError:
    print("Error: Could not import network_analysis module.")
    print("Make sure you've installed required dependencies:")
    print("  pip install -r requirements.txt")
    sys.exit(1)

def process_request(input_file: str) -> Dict[str, Any]:
    """
    Process a network analysis request from a JSON input file
    
    Args:
        input_file: Path to JSON input file
        
    Returns:
        Result data
    """
    # Load input data
    with open(input_file, 'r') as f:
        request_data = json.load(f)
    
    # Extract parameters
    source = tuple(request_data['source'])
    time_thresholds = request_data['timeThresholds']
    network_file = request_data['networkFile']
    output_file = request_data['outputFile']
    
    # Check if network file exists
    if not os.path.exists(network_file):
        return {
            "success": False,
            "error": f"Network file not found: {network_file}"
        }
    
    # Create network graph
    try:
        G = create_network_from_geojson(network_file)
        print(f"Created graph with {len(G.nodes)} nodes and {len(G.edges)} edges")
    except Exception as e:
        traceback.print_exc()
        return {
            "success": False,
            "error": f"Error creating network graph: {str(e)}"
        }
    
    # Generate isochrones
    try:
        speed = request_data.get('speed', 5.0)  # km/minute
        isochrones = generate_isochrones(G, source, time_thresholds, speed)
        print(f"Generated {len(isochrones['features'])} isochrones")
    except Exception as e:
        traceback.print_exc()
        return {
            "success": False,
            "error": f"Error generating isochrones: {str(e)}"
        }
    
    # Save results to output file
    try:
        with open(output_file, 'w') as f:
            json.dump({
                "success": True,
                "source": source,
                "timeThresholds": time_thresholds,
                "isochrones": isochrones
            }, f)
        print(f"Saved results to {output_file}")
    except Exception as e:
        traceback.print_exc()
        return {
            "success": False,
            "error": f"Error saving results: {str(e)}"
        }
    
    return {
        "success": True,
        "message": f"Analysis completed successfully"
    }

def main():
    """
    Main function for CLI usage
    """
    # Check command line arguments
    if len(sys.argv) != 2:
        print("Usage: python run_analysis.py <input_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)
    
    # Process the request
    result = process_request(input_file)
    
    # Print result
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result.get('success', False) else 1)

if __name__ == "__main__":
    main() 