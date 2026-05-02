/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

import Geolocation from 'react-native-geolocation-service';
import useLocationStore from '../store/useLocationStore';
import useMapStore from '../features/map/store/useMapStore';
import { utils } from '../utils/Utils';
import { height } from '../utils/Utils';

class currentLocation {
  constructor() {}
  async getCurrentLocation() {
    const {location} = useLocationStore.getState();
    const {setMapLocation,setLoading,mapShown,setMapBounds,} = useMapStore.getState();
    setLoading(true); // Set loading to true before starting the geolocation process
    if(location){
      
      const bounds = utils.getBoundingBoxFromLocation(location, 200)
    
      const margin = [10, 10, 10, height*0.4]  
      const finalBounds = [bounds, margin]
      
      setMapBounds(finalBounds);
     
      setLoading(false); 
    }
    else{
      setLoading(false);
    }
  }
}

const locationTask = new currentLocation();
export default locationTask;
