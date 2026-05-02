import React, { useContext, useState } from 'react';
import Config from 'react-native-config';
import polyline from '@mapbox/polyline'
import useUserStore from '../store/useUserStore';
import { useTripAcceptStore } from '../../notdriver/store/useTripAcceptStore';
import useTripsStore from '../../notdriver/store/useTripsStore';
import { useMapMarkerStore } from '../store/useMapMarkerStore';
import APIRequest from '../APIRequest';
import TripLocationFetch from './TripLocationFetch';
import { firebaselog_onRide } from '../utils/FirebaseAnalytics';
import { useTranslation } from 'react-i18next';

const TripFareCalculator = ({ tripData, onDone, setLoading, setError, isGetFare }) => {
  const {userInfo} = useUserStore()
  const [useLocationFetch, setUseLocationFetch] = useState(true);
  const {tripCancelReason} = useTripAcceptStore()
  const {getReachedStops, currentTripAcceptedTime} = useTripsStore()
  const reachedStops = getReachedStops();
  const {userLocation} = useMapMarkerStore();
  const {t} = useTranslation();

  // Prepare lat/lng list for route API
  const latlngs = () => {
    return reachedStops?.map(item => ({
      lat: item.location[1],
      lon: item.location[0],
    })) || [];
  };

  // // Fetch route data from external API
  // const fetchRouteData = async (driverLoc) => {
  //   try {
  //     const coordinatesArray = latlngs();
  //     if (userLocation) {
  //       coordinatesArray.push({
  //         lat: userLocation[0],
  //         lon: userLocation[1]
  //       });
  //     }
  //     const jsonObject = {
  //       costing: 'auto',
  //       costing_options: {},
  //       language: 'en',
  //       locations: coordinatesArray ? coordinatesArray : [],
  //       units: 'kilometers',
  //     };
  //     const jsonString = JSON.stringify(jsonObject);
  //     const encodedData = encodeURIComponent(jsonString);
  //     const url = `${Config.ROUTE_API_URL}?data=${encodedData}&access_token=${Config.NE_ACCESS_TOKEN}`;
  //     const response = await fetch(url, { method: 'GET' });
  //     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  //     const routeData = await response.json();
  //     // Return only trip info
  //     return routeData?.trip || {};
  //   } catch (error) {
  //     console.error('fetchRouteData error:', error);
  //     return {};
  //   }
  // };

  // Fetch route data from external API
  const fetchMapMatchData = async (driverInitialLatLng) => {
    const reversedCoordinates = driverInitialLatLng?.map(([lon, lat]) => [lat, lon]);
    if (userLocation) {
      reversedCoordinates.push([userLocation[0], userLocation[1]]);
    }
    const encodedData = polyline.encode(reversedCoordinates, 6);
    const api = new APIRequest(Config.MAP_MATCH_URL);
    try {
      const jsonObject = {
        encoded_polyline: encodedData ? encodedData : '',
        shape_match: "map_snap",
        costing: "auto"
      };
      const response = await api.request('', 'POST', jsonObject, userInfo?.token); 
      return response?.trip || {};
    } catch (error) {
      console.error('fetchRouteData error:', error);
      return {};
    }
  };

  // Fetch final fare
  const fetchFair = async (tripData, totalDistance, totalDuration, encodedData) => {
    try {
      const api = new APIRequest();
      const payload = {
        encodedPolyline: encodedData,
        droppedAtLoc: {
          lat: userLocation?.[0],
          lon: userLocation?.[1]
        }
      }
      const url = `/publicrides/driver/v2/getTotalFare?tripId=${tripData._id}&distance=${totalDistance}&duration=${totalDuration}`;
      const res = await api.request(url, 'POST', payload, userInfo?.token);
      if (res?.success) {
        return res;
      } else {
        return res;
      }
    } catch (error) {
      return error;
    }
  };

    // cancel final fare
    const cancelOnGoingTrip = async (tripData, totalDistance, totalDuration, encodedData) => {
      try {
        const payload = {
          "tripId": tripData._id,
          "reason": t(tripCancelReason) || tripCancelReason,
          "totalDistance": totalDistance,
          "totalDuration": totalDuration,
          "encodedPolyline" : encodedData,
          "isBeforePickup": false,
          "droppedAtLoc": {
           "lat": userLocation?.[0],
           "lon": userLocation?.[1]
         }
        }
        const api = new APIRequest();
        const url = `/publicrides/driver/v2/cancelTrip`;
        const res = await api.request(url, 'POST', payload, userInfo?.token);
        if (res?.success) {
          return res;
        } else {
          return res;
        }
      } catch (error) {
        return error;
      }
    };

  // Handle distance and fare calculation
  const handleLocationData = async (data) => {
    setLoading(true);
    const totalDistance = data?.data?.sessions!=0 ? data?.data?.sessions?.reduce((acc, session) => acc + (session[5] || 0), 0) : 0;
    const times = data?.data?.times || [];
    const totalDuration = times.length > 1 ? times[times.length - 1] - times[0] : 0;
    const minutes = Math.floor(totalDuration / 60000);
    const driverInitialLatLng = data?.data?.lngLats ? data?.data?.lngLats : [];

    try {
      // Step 2: Call map match API first
      let otherApiData = await fetchMapMatchData(driverInitialLatLng);

      let apiDistance = otherApiData?.summary?.length || 0;
      let apiDuration = otherApiData?.summary?.time ? Math.floor(otherApiData?.summary?.time / 60) : 0; // convert seconds->minutes if API returns seconds
      let encodedPloyline = otherApiData?.legs?.[0]?.shape || '';
      
      // If both apiDistance and apiDuration are 0, fallback to fetchRouteData
      // if (apiDistance === 0 || apiDuration === 0) {
      //   console.log('Map match returned zero distance and duration, falling back to fetchRouteData');
      //   otherApiData = await fetchRouteData(driverInitialLatLng);
      //   apiDistance = otherApiData?.summary?.length || 0;
      //   apiDuration = otherApiData?.summary?.time ? Math.floor(otherApiData?.summary?.time / 60) : 0;
      //   encodedPloyline = otherApiData?.legs?.[0]?.shape || '';
      // }

      // console.log('hari-->>otherApiData-->> 1', apiDistance, apiDuration)
      // console.log('hari-->>otherApiData-->> 2', totalDistance, minutes)
      // console.log('hari-->>encodedPloyline-->>',encodedPloyline)

      const  finalDistance = totalDistance;
      const  finalDuration = minutes;

      // if (apiDistance > totalDistance) {
      //   finalDistance = apiDistance;
      //   finalDuration = apiDuration;
      // } else {
      //   finalDistance = totalDistance;
      //   finalDuration = minutes;
      // }

      const _finalDistance = finalDistance ? finalDistance?.toFixed(2) : 0;
      const _finalDuration = finalDuration; 

       console.log('hari-->>finalDistance-->>',_finalDistance)
      console.log('hari-->>finalDuration-->>',finalDuration)

      const encodedData = otherApiData?.legs?.[0]?.shape || '';
      
      if(isGetFare) {
       // Step 4: Fetch final fare
       const fareResponse = await fetchFair(tripData, _finalDistance, _finalDuration, encodedData);
       if (onDone) return onDone(fareResponse, encodedPloyline);
      } else {
        const cancelResponse = await cancelOnGoingTrip(tripData, _finalDistance, _finalDuration, encodedData);
        if (onDone) return onDone(cancelResponse, encodedPloyline);
      }
      // if (onDone) return onDone(otherApiData);
    } catch (err) {
      console.error('Error fetching or comparing distances', err);
      if (setError) setError(err);
    } finally {
      // if (setLoading) setLoading(false);
    }
  };

  if (!useLocationFetch) return null;

  return (
    <TripLocationFetch
      startTime={currentTripAcceptedTime || new Date().setHours(0, 0, 0, 0)}
      endTime={new Date().setHours(23, 59, 59, 999)}
      tripId={tripData._id}
      // setLoading={setLoading}
      setError={setError}
      onDataProcessed={handleLocationData}
    />
  );
};

export default TripFareCalculator;
