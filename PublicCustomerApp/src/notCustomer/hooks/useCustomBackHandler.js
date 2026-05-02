import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useStackScreenStore } from '../store/useStackScreenStore';
import  useCurrentRideInfoStore from '../features/rideStatus/store/useCurrentRideInfoStore';
import { TripStatus }  from '../features/rideStatus/types/TripStatus';
export const useCustomBackHandler = () => {
  const { goBack, stackScreen } = useStackScreenStore();
  const { tripStatus ,setShowBookingCancelModel} = useCurrentRideInfoStore();

  useEffect(() => {
    const onBackPress = () => {
     
      if (stackScreen.length > 1 && tripStatus !== TripStatus.ACCEPTED && tripStatus !== TripStatus.PICKEDUP && tripStatus !== TripStatus.PENDING) {
        
        goBack();
        return true; // handled
      } else if(stackScreen.length > 1 && tripStatus === TripStatus.PENDING){
    
        setShowBookingCancelModel(true)
        return true; // handled
      }
 
      
      return false; // let OS handle (e.g., exit app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      backHandler.remove();
    };
  }, [stackScreen, goBack,tripStatus]);
}; 