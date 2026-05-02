import Geolocation from 'react-native-geolocation-service';
import { RequestFineLocationPermission } from '../controllers/PermissionHandler';

export const getCurrentDeviceLocation = () => {
  return new Promise(async (resolve, reject) => {
    const hasPermission = await RequestFineLocationPermission();
    if (!hasPermission) {
      reject(new Error('Location permission not granted.'));
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLocation = { latitude, longitude };
        resolve(currentLocation);
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};
