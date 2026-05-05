import { useCallback, useState } from 'react';
import { Vibration } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import useActingDriverBookingService from '../services/useActingDriverBookingService';
import useCurrentRideInfoStore from '../../rideStatus/store/useCurrentRideInfoStore';
import { DataStore } from '../../../controllers/DataStore';
import PREF from '../../../storage/PREF';
import { showNotification } from '../../../components/NotificationManger';
import useRideMatching from '../../../hooks/useRideMatching';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import rideMatchingSocketService from '../../../controllers/RideMatchingSocketService';

const useActingDriverBookTrip = () => {
  const { setStackScreen } = useStackScreenStore();
  const [loading, setLoading] = useState(false);
  const { setCurrentRideInfo } = useCurrentRideInfoStore();
  const { t } = useTranslation();
  const { initializeSocket, startMatching, setRideMatchStatus } = useRideMatching();
  const { id: userId } = useUserInfoStore();

  const handleBookingSuccess = useCallback(() => {}, []);
  const handleBookingError = useCallback((error) => {
    console.log('Acting driver booking failed:', error);
  }, []);

  const bookingService = useActingDriverBookingService({
    onSuccess: handleBookingSuccess,
    onError: handleBookingError,
  });

  const handleBookTrip = useCallback(
    async (customData = null) => {
      try {
        setLoading(true);
        Vibration.vibrate();

        const result = await bookingService.bookTrip(customData);

        if (result?.success && result?.trip) {
          try {
            await DataStore.storeData(PREF.CURRENT_TRIP, result.trip?._id);
            setCurrentRideInfo(result.trip);
            setRideMatchStatus({
              status: 'searching',
              message: t('searching_for_drivers', 'Searching for drivers...'),
              driver: null,
            });
            setStackScreen('RideStatus', {});

            let connected = rideMatchingSocketService.isConnected();
            if (!connected) {
              connected = await initializeSocket(userId);
            }
            if (!connected) {
              setRideMatchStatus({
                status: 'failed',
                message: t('network_error'),
                driver: null,
              });
              showNotification(t('network_error'), t('please_try_again'), 'danger');
              return result;
            }

            startMatching(result.tripId, userId, result?.trip?.vehicleType);
            return result;
          } catch (err) {
            console.error('Error handling acting driver trip navigation:', err);
            throw err;
          }
        }

        return result;
      } catch (error) {
        console.error('Acting driver booking failed:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [bookingService, initializeSocket, userId, t, setCurrentRideInfo, setStackScreen, startMatching, setRideMatchStatus],
  );

  return {
    isLoading: loading,
    isError: bookingService.isError,
    error: bookingService.error,
    data: bookingService.data,
    bookTrip: handleBookTrip,
    isBookingReady: bookingService.isBookingReady,
    getBookingValidationErrors: bookingService.getBookingValidationErrors,
    bookingData: bookingService.bookingData,
  };
};

export default useActingDriverBookTrip;
