/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

import Geolocation from "react-native-geolocation-service";
import { useMapMarkerStore } from "../store/useMapMarkerStore";


class currentLocation {
  constructor() {}
  async getCurrentLocation() {
    const {setUserLocation} = useMapMarkerStore.getState();
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve(position);
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          reject(error);
        },
        {
          accuracy: {
            android: "high",
            ios: "bestForNavigation",
          },
          enableHighAccuracy: true,
          maximumAge: 20000,
          distanceFilter: 0,
          useSignificantChanges: false,
        }
      );
    });
  }
}

const locationTask = new currentLocation();
export default locationTask;
