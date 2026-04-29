from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import math
import requests
import json

class Solver:
    # start_location is a tuple of (longitude, latitude)
    # stops is a list of tuples of (longitude, latitude)
    # end_location is a tuple of (longitude, latitude), defaults to start_location if not provided
    def __init__(self, start_location, stops, end_location=None):
        self.start_location = start_location
        self.stops = stops
        self.end_location = end_location if end_location else start_location


    def calculate_distance_matrix(self):
        # Create distance matrix including start location, stops, and end location
        locations = [self.start_location] + self.stops + [self.end_location]
        size = len(locations)
        distance_matrix = [[0] * size for _ in range(size)]
        
        for i in range(size):
            for j in range(size):
                if i != j:
                    # Calculate Haversine distance between points
                    lat1, lon1 = locations[i]
                    lat2, lon2 = locations[j]
                    
                    # Convert to radians
                    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
                    
                    # Haversine formula
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                    c = 2 * math.asin(math.sqrt(a))
                    r = 6371  # Radius of earth in kilometers
                    
                    distance_matrix[i][j] = int(c * r * 1000)  # Convert to meters and round to integer
                    
        return distance_matrix

    def calculate_distance_matrix_valhalla(self):
        # Create list of locations including start, stops and end
        locations = [self.start_location] + self.stops + [self.end_location]
        size = len(locations)
        
        # Prepare locations for Valhalla API
        sources = []
        targets = []
        for loc in locations:
            sources.append({"lon": loc[0], "lat": loc[1]})
            targets.append({"lon": loc[0], "lat": loc[1]})
            
        # Prepare request payload
        payload = {
            "sources": sources,
            "targets": targets,
            "costing": "auto"
        }
        
        # Make request to Valhalla API
        try:
            response = requests.post(
                "https://nav.vmmaps.com/neapi/v1/directions/api?op=pmatrix",
                json=payload
            )
            response.raise_for_status()
            
            # Parse response and create distance matrix
            matrix_data = response.json()
            print(matrix_data, 'matrix_data')
            distance_matrix = [[0] * size for _ in range(size)]
            
            for i in range(size):
                for j in range(size):
                    if i != j:
                        # Get distance in meters from Valhalla response
                        distance_matrix[i][j] = int(matrix_data['matrix'][i][j]['distance'] * 1000)
                        
            return distance_matrix
            
        except Exception as e:
            print(f"Error getting distance matrix from Valhalla: {e}")
            # Fallback to Haversine calculation if Valhalla fails
            return self.calculate_distance_matrix()

    def solve(self):
        # Create the routing index manager
        distance_matrix = self.calculate_distance_matrix()
        num_nodes = len(distance_matrix)
        print(f"Created distance matrix with {num_nodes} nodes")
        
        # Create manager with start and end depots
        manager = pywrapcp.RoutingIndexManager(
            num_nodes,  # number of locations
            1,  # number of vehicles
            [0],  # start depot index
            [num_nodes - 1])  # end depot index
        print("Created routing index manager")

        # Create Routing Model
        routing = pywrapcp.RoutingModel(manager)
        print("Created routing model")

        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return distance_matrix[from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        print("Registered transit callback and set arc cost evaluator")

        # Add Distance constraint
        dimension_name = 'Distance'
        routing.AddDimension(
            transit_callback_index,
            0,  # no slack
            30000000,  # vehicle maximum travel distance (30,000 km)
            True,  # start cumul to zero
            dimension_name)
        distance_dimension = routing.GetDimensionOrDie(dimension_name)
        distance_dimension.SetGlobalSpanCostCoefficient(100)
        print("Added distance dimension constraint")

        # Setting first solution heuristic
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
        print("Set search parameters with PATH_CHEAPEST_ARC strategy")

        # Solve the problem
        print("Starting to solve routing problem...")
        solution = routing.SolveWithParameters(search_parameters)
        print(f"Solution found: {solution is not None}")

        if solution:
            # Get the route
            index = routing.Start(0)
            route = []
            while not routing.IsEnd(index):
                route.append(manager.IndexToNode(index))
                index = solution.Value(routing.NextVar(index))
            route.append(manager.IndexToNode(index))
            print(f"Generated route with {len(route)} stops")
            
            # Convert route indices back to locations
            locations = [self.start_location] + self.stops + [self.end_location]
            optimized_route = [locations[i] for i in route]
            print("Original locations:", locations)
            print("Optimized route:", optimized_route)

            return optimized_route
        print("No solution found")
        return None


if __name__ == "__main__":
    solver = Solver((77.1025, 28.7141), [(77.1025, 28.4141), (77.1025, 28.2141), (77.1025, 28.7641)])
    print(solver.solve())