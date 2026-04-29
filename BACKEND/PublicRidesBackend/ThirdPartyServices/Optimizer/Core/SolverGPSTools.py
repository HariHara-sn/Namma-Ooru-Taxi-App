from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import math
import requests
import json
from typing import List, Tuple, Dict, Optional
import pprint

print("AJIN SOLVER GPS TOOLS")
class SolverGPSTools:
    def __init__(self, vehicles: List[Dict], waypoints: List[Dict]):
        """
        Initialize the solver with multiple vehicles and waypoints
        
        Args:
            vehicles: List of vehicle dictionaries containing:
                     - location: Dict with start location
                       - start: Tuple[float, float] (longitude, latitude)
                     - id: str - unique identifier for vehicle
                     - capacity: Optional[int] - maximum distance/time capacity
            waypoints: List of dictionaries containing:
                      - location: Tuple[float, float] (longitude, latitude)
                      - id: str - unique identifier for waypoint
        """
        self.vehicles = vehicles
        self.waypoints = waypoints
        self.num_vehicles = len(vehicles)

        print(self.vehicles, "AJIN VEHICLES")
        print(self.waypoints, "AJIN WAYPOINTS")
        
        # Set default capacity if not provided
        for vehicle in self.vehicles:
            if 'capacity' not in vehicle:
                vehicle['capacity'] = 30000000  # Default 30,000 km in meters

    def calculate_distance_matrix(self):
        # Create a list of all locations (vehicle starts + waypoints)
        locations = []
        
        # Add all vehicle start locations
        for vehicle in self.vehicles:
            locations.append(vehicle['location']['start'])
            
        # Add all waypoints
        locations.extend([wp['location'] for wp in self.waypoints])
            
        size = len(locations)
        distance_matrix = [[0] * size for _ in range(size)]
        
        for i in range(size):
            for j in range(size):
                if i != j:
                    # Calculate Haversine distance between points
                    lon1, lat1 = locations[i]
                    lon2, lat2 = locations[j]
                    
                    # Convert to radians
                    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
                    
                    # Haversine formula
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                    c = 2 * math.asin(math.sqrt(a))
                    r = 6371  # Radius of earth in kilometers
                    
                    distance_matrix[i][j] = int(c * r * 1000)  # Convert to meters
        print(distance_matrix, "AJIN DISTANCE MATRIX")
        return distance_matrix

    def solve(self):
        # Create the routing index manager and model
        distance_matrix = self.calculate_distance_matrix()
        num_locations = len(self.waypoints)
        
        # Calculate depot starts and ends - vehicles return to their start
        starts = [i for i in range(self.num_vehicles)]
        ends = starts  # Vehicles return to their start locations
        
        manager = pywrapcp.RoutingIndexManager(
            len(distance_matrix),
            self.num_vehicles,
            starts,
            ends
        )
        routing = pywrapcp.RoutingModel(manager)

        # Define distance callback
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return distance_matrix[from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Add Distance constraint for each vehicle
        dimension_name = 'Distance'
        routing.AddDimension(
            transit_callback_index,
            0,  # no slack
            max(vehicle['capacity'] for vehicle in self.vehicles),  # vehicle maximum travel distance
            True,  # start cumul to zero
            dimension_name)
        distance_dimension = routing.GetDimensionOrDie(dimension_name)
        distance_dimension.SetGlobalSpanCostCoefficient(100)

        # Set first solution heuristic
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        # search_parameters.first_solution_strategy = (
        #     routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
        # search_parameters.local_search_metaheuristic = (
        #     routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
        # search_parameters.time_limit.seconds = 30

        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)

        if solution:
            routes = {}
            # Get routes for each vehicle
            for vehicle_id in range(self.num_vehicles):
                index = routing.Start(vehicle_id)
                route = []
                
                while not routing.IsEnd(index):
                    node_index = manager.IndexToNode(index)
                    # Skip adding the start depot to the route
                    if node_index >= self.num_vehicles and node_index < len(distance_matrix):
                        # Adjust index to get correct waypoint
                        waypoint_index = node_index - self.num_vehicles
                        route.append(self.waypoints[waypoint_index]['id'])
                    index = solution.Value(routing.NextVar(index))
                
                routes[self.vehicles[vehicle_id]['id']] = route
            
            return routes
        return None


if __name__ == "__main__":
    # Example usage
    vehicles = [
        {
            "location": {
                "start": (77.1025, 28.7141)
            },
            "id": "vehicle_1",
            "capacity": 30000000
        },
        {
            "location": {
                "start": (77.2025, 28.7141)
            },
            "id": "vehicle_2", 
            "capacity": 30000000
        }
    ]
    
    waypoints = [
        {"location": (77.1025, 28.4141), "id": "stop_1"},
        {"location": (77.1025, 28.2141), "id": "stop_2"},
        {"location": (77.1025, 28.7641), "id": "stop_3"},
        {"location": (77.2025, 28.4141), "id": "stop_4"},
        {"location": (77.2025, 28.2141), "id": "stop_5"}
    ]
    
    solver = SolverGPSTools(vehicles, waypoints)
    result = solver.solve()
    print(json.dumps(result, indent=4)) 