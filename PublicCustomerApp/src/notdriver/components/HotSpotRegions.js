import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import useHotSpotStore from '../store/useHotSpotStore';
import Circle from '../../common/map/Circle';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';

function getColorsByIntensity(intensity) {
  if (intensity >= 0.1 && intensity <= 0.3) {
    return {
      fillColor: '#1A66BB6A',  // 10% transparent green
      strokeColor: '#66BB6A',  // solid green
    };
  } else if (intensity > 0.3 && intensity <= 0.6) {
    return {
      fillColor: '#1AFFA726',  // 10% transparent orange
      strokeColor: '#FFA726',  // solid orange
    };
  } else if (intensity > 0.8) {
    return {
      fillColor: '#1AEF5350',  // 10% transparent red
      strokeColor: '#EF5350',  // solid red
    };
  } else {
    return {
      fillColor: '#1A9E9E9E',  // 10% transparent gray
      strokeColor: '#9E9E9E',  // solid gray
    };
  }
}

const HotSpotRegions = () => {
    const {hotSportMarkers} = useHotSpotStore()
    const {setGeometries} = useMapMarkerStore()

    useEffect(() => {
        if (!hotSportMarkers || hotSportMarkers?.length === 0) return;
        let fences = [];
        hotSportMarkers.forEach((mapMarkers) => {
          // console.log(DateTimeFormatter.convertSecondsToReadable(mapMarkers.start_time))
          const fence = new Circle(
            new Date().getTime(),
            'geofence',
            mapMarkers.latitude,
            mapMarkers.longitude,
            mapMarkers.radius_km * 1000,
            getColorsByIntensity(mapMarkers.intensity).fillColor,
            getColorsByIntensity(mapMarkers.intensity).strokeColor,
            'medium'
          );
      
          // fence.setFocus(true);
          fence.setPadding([20, 20, 20, 380]);
          fences.push(fence);
        });
      
        if (fences.length > 0) {
          setGeometries(fences);
        }
        return () => {
            setGeometries(null);
          };
      }, [hotSportMarkers]);

  return (
   <></>
  )
}

export default HotSpotRegions