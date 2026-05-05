import { useCallback, useState } from 'react';
import {  Vibration } from 'react-native';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import useBookingService from '../services/useBookingService';
import useCurrentRideInfoStore from '../../rideStatus/store/useCurrentRideInfoStore';
import { DataStore } from '../../../controllers/DataStore';
import PREF from '../../../storage/PREF';
import { showNotification } from '../../../components/NotificationManger';
import { useTranslation } from 'react-i18next';
import useRideMatching from '../../../hooks/useRideMatching';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import useScheduleStore from '../../schedule/store/useScheduleStore';
import useScheduleTripStore from '../../../store/useScheduleTripStore';
import rideMatchingSocketService from '../../../controllers/RideMatchingSocketService';
/**
 * Simple hook for booking trips with navigation handling
 * @returns {Object} Booking functions and state
 */


const useBookTrip = () => {
  const { setStackScreen } = useStackScreenStore();
  const [loading, setLoading] = useState(false);
  const { setCurrentRideInfo } = useCurrentRideInfoStore();
  const { t } = useTranslation();
  const { initializeSocket, startMatching, setRideMatchStatus } = useRideMatching();
  const { setFromPayload } = useScheduleStore();
  const { id: userId } = useUserInfoStore();
  const { addScheduledTrip } = useScheduleTripStore();
  // Booking success callback - navigate to appropriate screen
  const handleBookingSuccess = useCallback(() => {
      //  console.log('data', data)
      // Navigate to ride status screen with booking data
      

  }, [setStackScreen]);

  // Booking error callback
  const handleBookingError = useCallback((error) => {
    console.log('Booking failed:', error);
    // Additional error handling can be added here
  }, []);

  // Initialize booking service with callbacks
  const bookingService = useBookingService({
    onSuccess: handleBookingSuccess,
    onError: handleBookingError
  });

  

  /**
   * Book trip with current booking data
   * @param {Object} customData - Optional custom data to override defaults
   */
  const handleBookTrip = useCallback(async (customData = null) => {
    try {
      setLoading(true);
      Vibration.vibrate();

      // console.log('Booking payload:', customData || bookingService.prepareBookingPayload());
    
      const result = await bookingService.bookTrip(customData);
      
      if(result?.success && result?.trip){
        console.log("=====> RESULT", JSON.stringify(result))
        if(result?.trip?.isScheduledTrip){
          try {
            setFromPayload(result.trip);
            await DataStore.storeData(PREF.SCHEDULED_TRIP, result.trip?._id);
            addScheduledTrip(result.trip);
            setStackScreen('ScheduleScreen', {
              fromBookScreen: true,
              trip:result.trip
            });
            return result;
          } catch (err) {
            console.error('Error handling scheduled trip:', err);
            throw err;
          }
        }
        try {
          await DataStore.storeData(PREF.CURRENT_TRIP, result.trip?._id);
         
          setCurrentRideInfo(result.trip);
          setRideMatchStatus({
            status: 'searching',
            message: t('searching_for_drivers', 'Searching for drivers...'),
            driver: null
          });
          setStackScreen('RideStatus', {});

          // Ensure ride-matching socket is connected before proceeding
          let connected = rideMatchingSocketService.isConnected();
          if (!connected) {
            connected = await initializeSocket(userId);
          }
          if (!connected) {
            setRideMatchStatus({
              status: 'failed',
              message: t('network_error'),
              driver: null
            });
            showNotification(t('network_error'), t('please_try_again'), 'danger');
            return result;
          }
        
          // showNotification(t('booking_successful'), t('your_ride_has_been_booked_successfully'), 'success'); 
          
          startMatching(result.tripId, userId, result?.trip?.vehicleType);
          return result;
        } catch (err) {
          console.error('Error handling current trip:', err);
          throw err;
        }
      }
      return result;
      
    } catch (error) {
      console.error('Booking failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [bookingService, initializeSocket, userId, t, setCurrentRideInfo, setStackScreen, startMatching, setRideMatchStatus]);

  /**
   * Get current booking payload for debugging
   * @returns {Object} Current booking payload
   */
  const getCurrentBookingPayload = useCallback(() => {
    try {
      return bookingService.prepareBookingPayload();
    } catch (error) {
      console.error('Error preparing booking payload:', error);
      return null;
    }
  }, [bookingService]);

  return {
    // Booking state
    isLoading: loading,
    isError: bookingService.isError,
    error: bookingService.error,
    data: bookingService.data,
    
    // Booking actions
    bookTrip: handleBookTrip,
    getCurrentBookingPayload,
    
    // Validation
    isBookingReady: bookingService.isBookingReady,
    getBookingValidationErrors: bookingService.getBookingValidationErrors,
    
    // Current booking data
    bookingData: bookingService.bookingData
  };
};

export default useBookTrip; 
