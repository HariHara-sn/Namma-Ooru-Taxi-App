import { utils } from '../../../utils/Utils';
import { findRoute } from '../../../controllers/NEMap/findRoute';

export const getTotalDistanceAndTime = async (stops,pickup=false) => {
    const totalStops = stops.filter((stop) => pickup ? !stop.isReached : stop.isReached).map((stop) => {
        return stop.location;
    });
    
    // Get current user location and add to totalStops
    if(!pickup){
        const currentUserLocation = await utils.getCurrentUserLocation();
        if (currentUserLocation) {
            totalStops.push(currentUserLocation);
        }
    }
     
    console.log('Total Stops for route calculation:', totalStops);
    
    // If we have at least 2 points, calculate route
    if (totalStops.length >= 2) {
        try {
            // Transform coordinates to the format expected by findRoute
            const routePoints = totalStops.map(location => ({
                lat: location[1], // latitude
                lon: location[0]  // longitude
            }));

           
            
            // Call findRoute API
            const routeRes = await findRoute(routePoints);

            const routeData = routeRes?.response;
            
            if (routeData && routeData.trip && routeData.trip.summary) {
                const { length, time } = routeData.trip.summary;
                
                // Convert time from seconds to minutes
                const durationInMinutes = Math.round(time / 60);
                
               
                
                return {
                   
                    totalDistance: length, // in kilometers
                    totalDuration: durationInMinutes, // in minutes
                    
                };
            } else {
                
                return {
                  
                    totalDistance: 0,
                    totalDuration: 0,
                  
                };
            }
        } catch (error) {
            console.error('Error calculating route:', error);
            return {
                totalStops,
                currentUserLocation,
                distance: 0,
                duration: 0,
                error: error.message
            };
        }
    } else {
        console.log('Insufficient points for route calculation');
        return {
            totalStops,
            currentUserLocation,
            distance: 0,
            duration: 0,
            error: 'Insufficient points for route calculation'
        };
    }
};
