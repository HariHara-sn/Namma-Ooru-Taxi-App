import { useCallback, useEffect, useMemo, useState } from 'react';
import { findRoute } from '../../../controllers/NEMap/findRoute';
import Polyline from '../../../controllers/NEMap/Polyline';
import polyline from '@mapbox/polyline';
import  useCurrentRideInfoStore  from '../store/useCurrentRideInfoStore';
const useDrawStopsPolyline = () => {
    const {stops} = useCurrentRideInfoStore();
    const [stopspolyline,setPolyline] = useState(null);

    // Build a signature string from stop content so updates are detected even if the array reference is re-used
    const stopsSignature = (stops || [])
        .map(stop => `${Boolean(stop.isReached)}:${stop?.location?.[0]},${stop?.location?.[1]}`)
        .join('|');

    const points = useMemo(() => {
        return (stops || [])
            .filter(stop => !stop.isReached)
            .map(stop => ({ lat: stop.location[1], lon: stop.location[0] }));
    }, [stopsSignature]);

    const fetchStops = useCallback(async () => {
        console.log("points",points);
        if (!points || points.length == 1) {
            setPolyline(null);
            return;
        }
        console.log("pointsiii",points);
        const routeRes = await findRoute(points);
        const routeData = routeRes?.response;
        
        if (!routeData?.trip?.legs || routeData.trip.legs.length === 0) {
          setPolyline(null);
          return;
        }
        
        const coordinates = await routeData.trip.legs.map(leg => {
          if (!leg.shape) {
            return [];
          }
          
          const decoded = polyline.decode(leg.shape, 6);
          return decoded.map(([lat, lon]) => [lon, lat]);
        }).flat();
        
        const polylineObj = new Polyline(
            'driver-to-start',
            'Driver to Pickup',
            coordinates,
            '#888888',
            'small'
        );
        polylineObj.setFocus(false)
        setPolyline(polylineObj);
    }, [points]);

    useEffect(() => {
        fetchStops();
    }, [fetchStops, stopsSignature]);

    return {stopspolyline};
    
}

export default useDrawStopsPolyline;    