from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .Solver import Solver
from .SolverGPSTools import SolverGPSTools
from rest_framework import serializers

class LocationSerializer(serializers.Serializer):
    id = serializers.CharField(required=True)
    longitude = serializers.FloatField(required=True)
    latitude = serializers.FloatField(required=True)

class VehicleSerializer(serializers.Serializer):
    id = serializers.CharField(required=True)
    location = LocationSerializer()
    capacity = serializers.IntegerField(required=False, default=30000000)

class RouteRequestSerializer(serializers.Serializer):
    start_location = LocationSerializer()
    stops = LocationSerializer(many=True)
    end_location = LocationSerializer(required=False)

class StartLocationSerializer(serializers.Serializer):
    start = serializers.ListField(child=serializers.FloatField(), min_length=2, max_length=2)

class VehicleSerializerGPS(serializers.Serializer):
    id = serializers.CharField(required=True)
    location = StartLocationSerializer()
    capacity = serializers.IntegerField(required=False, default=30000000)

class WaypointSerializer(serializers.Serializer):
    id = serializers.CharField(required=True)
    location = serializers.ListField(child=serializers.FloatField(), min_length=2, max_length=2)

class RouteRequestSerializerGPS(serializers.Serializer):
    vehicles = VehicleSerializerGPS(many=True)
    waypoints = WaypointSerializer(many=True)

@api_view(['POST'])
def optimize_route(request):
    try:
        # Validate request data
        serializer = RouteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'error': 'Invalid request payload',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        
        # Extract coordinates
        start = (
            data['start_location']['longitude'],
            data['start_location']['latitude']
        )
        stops = [
            (stop['longitude'], stop['latitude'])
            for stop in data['stops']
        ]
        
        # Extract end location if provided
        end = None
        if 'end_location' in data:
            end = (
                data['end_location']['longitude'],
                data['end_location']['latitude']
            )

        # Initialize and run solver
        solver = Solver(start, stops, end)
        optimized_route = solver.solve()

        if optimized_route is None:
            return Response({
                'status': 'error',
                'error': 'Failed to find optimal route'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Format response with IDs
        start_location = {
            'id': data['start_location']['id'],
            'longitude': optimized_route[0][0],
            'latitude': optimized_route[0][1]
        }
        
        # Map optimized coordinates back to original stop IDs
        original_stops = data['stops']
        route_coordinates = []
        
        for lon, lat in optimized_route[1:]:  # Skip start location
            # Find matching stop from original data
            for stop in original_stops:
                if abs(stop['longitude'] - lon) < 0.0001 and abs(stop['latitude'] - lat) < 0.0001:
                    route_coordinates.append({
                        'id': stop['id'],
                        'longitude': lon,
                        'latitude': lat
                    })
                    break

        response_data = {
            'status': 'success',
            'route': {
                'start_location': start_location,
                'stops': route_coordinates
            }
        }

        # Add end location to response if it was provided
        if end:
            response_data['route']['end_location'] = {
                'id': data['end_location']['id'],
                'longitude': end[0],
                'latitude': end[1]
            }

        return Response(response_data)

    except Exception as e:
        return Response({
            'status': 'error',
            'error': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def optimize_route_gps_tools(request):
    try:
        # Validate request data
        serializer = RouteRequestSerializerGPS(data=request.data)
        if not serializer.is_valid():
            return Response({
                'status': 'error',
                'error': 'Invalid request payload', 
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        
        # Transform data to expected format
        vehicles_transformed = []
        for vehicle in data['vehicles']:
            vehicles_transformed.append({
                'id': vehicle['id'],
                'location': {
                    'start': tuple(vehicle['location']['start'])
                },
                'capacity': vehicle['capacity']
            })
            
        waypoints_transformed = []
        for waypoint in data['waypoints']:
            waypoints_transformed.append({
                'id': waypoint['id'],
                'location': tuple(waypoint['location'])
            })
        
        # Initialize solver and get solution
        solver = SolverGPSTools(vehicles_transformed, waypoints_transformed)
        solution = solver.solve()
        
        if not solution:
            return Response({
                'status': 'error',
                'error': 'Failed to find optimal route'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({
            'status': 'success',
            'routes': solution
        })
    except Exception as e:
        return Response({
            'status': 'error',
            'error': f'Internal server error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)