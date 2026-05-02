import { useCallback, useEffect, useRef, useState } from 'react';
import { findRoute } from '../../../controllers/NEMap/findRoute';
import Polyline from '../../../controllers/NEMap/Polyline';
import polyline from '@mapbox/polyline';
import useMapStore from '../../map/store/useMapStore';
import {utils} from '../../../utils/Utils';
import { useStackScreenStore } from '../../../store/useStackScreenStore';

export default function useRouteDraw({ destinationlat,destinationlon, driverLat, driverLon,remainingStops, isActingDriverTrip }) {
	const [estimatedDuration, setEstimatedDuration] = useState(1);
	const currentPolylineRef = useRef([]);
	const [isDiverted, setIsDiverted] = useState(true);
	const [remainingDistance, setRemainingDistance] = useState(0);
    const [originalDistance, setOriginalDistance] = useState(0);
    const [originalDuration, setOriginalDuration] = useState(0);
	const { setGeometries, setMapBounds } = useMapStore();
	const{getCurrentScreenName}=useStackScreenStore();

	
	useEffect(() => {
		if (destinationlat == null || destinationlon == null) return;
		setIsDiverted(true);
		currentPolylineRef.current = [];
		setRemainingDistance(0);
	}, [destinationlat, destinationlon]);
	useEffect(() => {
		if (!remainingStops) return;
		setIsDiverted(true);
		currentPolylineRef.current = [];
		setRemainingDistance(0);
		// Immediately reflect the updated remaining-stops polyline on the map
		// so UI updates without waiting for the next driver position tick.
		
		if(getCurrentScreenName() ==='RideStatus'){
		setGeometries([remainingStops]);
		}
		console.log("remainingStops",remainingStops)
		// Adjust bounds to the stops polyline if available
		if (remainingStops?.coordinates && remainingStops.coordinates.length > 1) {
			const bounds = utils.getBoundingBox(remainingStops.coordinates);
			if (bounds) {
				const margin = [20,100,20,500];
				console.log("bounds",bounds,margin)
				const finalBounds = [bounds, margin]
				console.log("finalBounds",finalBounds)
				setMapBounds(finalBounds);
			}
		}
	}, [remainingStops]);

	// Helpers: distance computations and simplification
	const EARTH_RADIUS_M = 6371000;
	function toRadians(deg) { return deg * Math.PI / 180; }
	function projectToMeters(lon, lat, lat0Rad) {
		const x = EARTH_RADIUS_M * toRadians(lon) * Math.cos(lat0Rad);
		const y = EARTH_RADIUS_M * toRadians(lat);
		return { x, y };
	}
	function distancePointToSegmentMeters(point, a, b) {
		// point, a, b are [lon, lat]
		const lat0Rad = toRadians(point[1]);
		const p = projectToMeters(point[0], point[1], lat0Rad);
		const pa = projectToMeters(a[0], a[1], lat0Rad);
		const pb = projectToMeters(b[0], b[1], lat0Rad);

		const vx = pb.x - pa.x;
		const vy = pb.y - pa.y;
		const wx = p.x - pa.x;
		const wy = p.y - pa.y;

		const c1 = vx * wx + vy * wy;
		const c2 = vx * vx + vy * vy;
		let t = 0;
		if (c2 > 0) {
			t = Math.max(0, Math.min(1, c1 / c2));
		}

		const projX = pa.x + t * vx;
		const projY = pa.y + t * vy;

		const dx = p.x - projX;
		const dy = p.y - projY;
		const dist = Math.hypot(dx, dy);
		return dist;
	}
	
	function nearestDistanceToPolylineMeters(point, coords) {
        coords=coords.slice(1)
		if (!coords || coords.length < 2) return Infinity;
		let minDist = Infinity;
		for (let i = 0; i < coords.length - 1; i++) {
			const a = coords[i];
			const b = coords[i + 1];
			const d = distancePointToSegmentMeters(point, a, b);
			if (d < minDist) {
				minDist = d;
				if (minDist <= 300) break; // short-circuit
			}
		}
		return minDist;
	}



    const extractRouteSummary = useCallback((routeData) => {
        if (!routeData?.trip?.legs || routeData.trip.legs.length === 0) {
          return null;
        }
    
        // For routes with waypoints, calculate total time and distance across all legs
        if (routeData.trip.legs.length > 1) {
          let totalTime = 0;
          let totalLength = 0;
          
          routeData.trip.legs.forEach(leg => {
            if (leg.summary) {
              totalTime += leg.summary.time || 0;
              totalLength += leg.summary.length || 0;
            }
          });
          
          return { time: totalTime, length: totalLength };
        }
    
        // Get the first leg's summary (for single leg routes)
        const leg = routeData.trip.legs[0];
        if (leg.summary) {
          return leg.summary;
        }
    
        return null;
      }, []);
	
	function findNearestOnPolyline(point, coords) {
		if (!coords || coords.length < 2) return { index: -1, t: 0, distance: Infinity, nearestPoint: null };
		let best = { index: -1, t: 0, distance: Infinity, nearestPoint: null };
		const lat0Rad = toRadians(point[1]);
		const p = projectToMeters(point[0], point[1], lat0Rad);
		for (let i = 0; i < coords.length - 1; i++) {
			const a = coords[i];
			const b = coords[i + 1];
			const pa = projectToMeters(a[0], a[1], lat0Rad);
			const pb = projectToMeters(b[0], b[1], lat0Rad);
			const vx = pb.x - pa.x;
			const vy = pb.y - pa.y;
			const wx = p.x - pa.x;
			const wy = p.y - pa.y;
			const c1 = vx * wx + vy * wy;
			const c2 = vx * vx + vy * vy;
			let t = 0;
			if (c2 > 0) t = Math.max(0, Math.min(1, c1 / c2));
			const projX = pa.x + t * vx;
			const projY = pa.y + t * vy;
			const dx = p.x - projX;
			const dy = p.y - projY;
			const dist = Math.hypot(dx, dy);
			if (dist < best.distance) {
				// interpolate lon/lat using t
				const lon = a[0] + (b[0] - a[0]) * t;
				const lat = a[1] + (b[1] - a[1]) * t;
				best = { index: i, t, distance: dist, nearestPoint: [lon, lat] };
			}
		}
		return best;
	}
	function trimPolylineFromNearest(coords, nearest,driverLat,driverLon) {
		if (!coords || coords.length < 2) return coords || [];
		if (!nearest || nearest.index < 0 || nearest.index >= coords.length - 1 || !nearest.nearestPoint) return coords;
		const nextSlice = coords.slice(nearest.index +1);
		const firstslicedistance = haversineMeters([driverLon,driverLat], coords[0])
		if(firstslicedistance > 150){
			const nextSlice = coords.slice(nearest.index + 2);
			return [ [driverLon,driverLat], ...nextSlice];
		}
		return [[driverLon,driverLat], ...nextSlice];
	}
	function haversineMeters(a, b) {
		// a, b: [lon, lat]
		const lat1 = toRadians(a[1]);
		const lat2 = toRadians(b[1]);
		const dLat = lat2 - lat1;
		const dLon = toRadians(b[0] - a[0]);
		const h = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
		const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
		return EARTH_RADIUS_M * c;
	}
	function computePolylineLengthMeters(coords) {
		if (!coords || coords.length < 2) return 0;
		let sum = 0;
		for (let i = 0; i < coords.length - 1; i++) {
			sum += haversineMeters(coords[i], coords[i + 1]);
		}
		return Math.round(sum);
	}

	const FetchRoute = async (points) => {
		const routeRes = await findRoute(points);
		const routeData = routeRes?.response;
	 
		if (!routeData?.trip?.legs || routeData.trip.legs.length === 0) {
		  return [];
		}
		
		// const coordinates = await routeData.trip.legs.map(leg => {
		//   if (!leg.shape) {
		// 	return [];
		//   }
		  
		//   const decoded = polyline.decode(leg.shape, 6);
		//   return decoded.map(([lat, lon]) => [lon, lat]);
		// }).flat();

		// console.log("routeData",routeData?.trip?.legs[0]?.shape)
		// console.log("decoded",polyline.decode(routeData.trip.legs[0].shape, 6))

		const coordinates = routeData?.trip?.legs[0]?.shape ? polyline.decode(routeData.trip.legs[0].shape, 6).map(([lat, lon]) => [lon, lat]) : [];


		currentPolylineRef.current = coordinates;
		setIsDiverted(false)
		const totalRemaining = computePolylineLengthMeters(coordinates);
		setRemainingDistance(totalRemaining);
		const routeSummary = extractRouteSummary(routeData);
		const originalKm = routeSummary?.length;
		const originalSec = routeSummary?.time;
		setOriginalDistance(originalKm);
		setOriginalDuration(originalSec);
		const estimatedTime = calculateEstimatedTime(totalRemaining, originalSec, originalKm);
		if (estimatedTime != null) {
			setEstimatedDuration(estimatedTime);
		}
		return coordinates;
	  }

	const renderPolyline = (polylines) => {
		if(remainingStops){
			polylines.push(remainingStops)
		}
		
			if(getCurrentScreenName() ==='RideStatus'){
		setGeometries(polylines);
			}
	}


    const SetViewBoundingBox = ()=>{
        const coords = currentPolylineRef.current
        const bounds = utils.getBoundingBox(coords)
        if(!bounds){
            return
        }
        const margin = [50,100,50,500]
        // Structure bounds properly: [bounds, margin] where bounds is [minLon, minLat, maxLon, maxLat]
        const finalBounds = [bounds, margin]
        setMapBounds(finalBounds);
		
    }


	const makePolyline = (coordinates,color='#000000',width='small'   ) => {
		const polylineObj = new Polyline(
			'driver-to-start',
			'Driver to Pickup',
			coordinates,
			color,
			width
		);
		polylineObj.setFocus(false)
        
		
		return polylineObj;
		
	};

    const calculateEstimatedTime = useCallback((remainingDistanceMeters, originalTime, originalDistanceKm) => {
        const originalDistanceMeters = (originalDistanceKm || 0) * 1000;
        if (!originalTime || !originalDistanceMeters) return null;
        const timePerMeter = originalTime / originalDistanceMeters;
        const estimatedTimeSeconds = remainingDistanceMeters * timePerMeter;
        const estimatedTimeMinutes = Math.round(estimatedTimeSeconds / 60);
        return Math.max(1, estimatedTimeMinutes);
      }, []);

	const checkRouteDiverted = (driverLat,driverLon) => {
		if(isDiverted){
			return true;
		}
		const current = currentPolylineRef.current;
		if (!current || current.length < 2) {
			return true;
		}
		const distance = nearestDistanceToPolylineMeters([driverLon, driverLat], current);
		// console.log("diverted distance",distance)
		const Diverted = distance > 300; // meters
		return Diverted;
	}

	const DrawRoute = async (driverLat,driverLon) => {
		const isDiverted = checkRouteDiverted(driverLat,driverLon)
        // console.log("isDiverted",isDiverted)
		const polylineArray = []
		if (isDiverted) {
            let points = [
                {lat:driverLat,lon:driverLon},
                {lat:destinationlat,lon:destinationlon}  
            ]
           
			const coordinates = await FetchRoute(points)
			
			if (coordinates && coordinates.length >= 2) {
				const polylineObj = makePolyline(coordinates)
				polylineArray.push(polylineObj)
			}
			
		} else {
			if (currentPolylineRef.current && currentPolylineRef.current.length >= 2) {
				// Trim current polyline ahead of driver location, then simplify
				const nearest = findNearestOnPolyline([driverLon, driverLat], currentPolylineRef.current);
				let trimmed = trimPolylineFromNearest(currentPolylineRef.current, nearest,driverLat,driverLon);
				
				currentPolylineRef.current = trimmed;
				const newRemaining = computePolylineLengthMeters(trimmed);
				setRemainingDistance(newRemaining);
                const estimatedTime = calculateEstimatedTime(newRemaining, originalDuration, originalDistance);
                setEstimatedDuration(estimatedTime);
				const polylineObj = makePolyline(trimmed)
				polylineArray.push(polylineObj)
			}
		}
		
		renderPolyline(polylineArray)

		
	}

	

	// Redraw route when destination or remainingStops change (e.g., stops updated)
	useEffect(() => {
		if (!driverLat || !driverLon) return;
		if (destinationlat == null || destinationlon == null) return;
		if (isActingDriverTrip) return;
		DrawRoute(driverLat, driverLon);
		return () => {
			setGeometries([]);
		}
	}, [destinationlat, destinationlon, remainingStops, driverLat, driverLon, isActingDriverTrip]);
	return {estimatedDuration,remainingDistance,SetViewBoundingBox}
  
}

