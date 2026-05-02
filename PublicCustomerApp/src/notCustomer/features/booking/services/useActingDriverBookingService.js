import { useState } from 'react';
import DeviceInfo from 'react-native-device-info';
import { useTranslation } from 'react-i18next';
import { bookActingDriverTrip } from '../../../API/EndPoints/EndPoints';
import { showNotification } from '../../../components/NotificationManger';
import useRideBookingLocationStore from '../store/useRideBookingLocationStore';
import useRideBookingInfo from '../store/useRideBookingInfo';
import useRideMatchStore from '../../rideStatus/store/useRideMatchStore';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import useCurrentRideInfoStore from '../../rideStatus/store/useCurrentRideInfoStore';
import { TripStatus } from '../../rideStatus/types/TripStatus';
import { utils } from '../../../utils/Utils';
import { firebaselog_tripBooking } from '../../../../common/utils/FirebaseAnalytics';

const useActingDriverBookingService = ({ onSuccess, onError } = {}) => {
  const { t } = useTranslation();

  const { rideStartLocation, rideEndLocation, rideWayPoints } = useRideBookingLocationStore();

  const {
    rideDistance,
    estimatedDuration,
    paymentType,
    rideBookMode,
    passangerDetails,
    safeNightRides,
    femaleDriverOnly,
    couponCode,
    regionOfficeId,
    regionOfficeCode,
    actingDriverHours,
    actingDriverVehicle,
  } = useRideBookingInfo();

  const { resetRideMatchStatus } = useRideMatchStore();
  const { setCurrentRideInfo, setTripStatus } = useCurrentRideInfoStore();
  const { incrementTotalTrips, setActiveTripId } = useUserInfoStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const prepareBookingPayload = () => {
    if (!rideStartLocation || !rideEndLocation) {
      throw new Error(t('start_end_locations_required'));
    }
    if (!actingDriverVehicle) {
      throw new Error(t('vehicle_selection_required'));
    }

    const stops = [
      {
        name: 'Pickup Point',
        location: [rideStartLocation.longitude, rideStartLocation.latitude],
        address: utils.formatAddressName(rideStartLocation),
        waitingTime: 0,
        isReached: false,
      },
    ];

    if (rideWayPoints?.length > 0) {
      rideWayPoints.forEach((wp, i) => {
        stops.push({
          name: `Stop ${i + 1}`,
          location: [wp.longitude, wp.latitude],
          address: utils.formatAddressName(wp),
          waitingTime: wp.waitingTime || 0,
          isReached: false,
        });
      });
    }

    stops.push({
      name: 'Drop Point',
      location: [rideEndLocation.longitude, rideEndLocation.latitude],
      address: utils.formatAddressName(rideEndLocation),
      waitingTime: 0,
      isReached: false,
    });

    const estimatedWaitTime = stops.reduce((sum, s) => sum + (s.waitingTime || 0), 0);

    const payload = {
      // Locations
      startLocation: [rideStartLocation.longitude, rideStartLocation.latitude],
      endLocation: [rideEndLocation.longitude, rideEndLocation.latitude],
      stops,

      // Acting driver specific
      isActingDriverTrip: true,
      actingDriverHours: actingDriverHours ?? null,
      passangerVehicleId: actingDriverVehicle._id,
      passangerVehicleType: actingDriverVehicle.type,

      // Vehicle & trip
      vehicleType: actingDriverVehicle.type || 'AUTO',
      passangerCount: 1,

      // Distance / fare
      estimatedDistance: rideDistance,
      estimatedDuration: estimatedDuration,

      // Booking details
      bookingFor: rideBookMode,
      bookingForName: passangerDetails?.name || '',
      bookingForPhone: passangerDetails?.phone || '',

      // Payment & preferences
      paymentMethod: paymentType || 'CASH',
      nightRide: safeNightRides,
      femaleOnly: femaleDriverOnly,

      // Region
      regionalOffice: regionOfficeId || null,
      regionCode: regionOfficeCode || 'default',

      // App metadata
      appVersion: DeviceInfo.getVersion?.() || '',
      buildNumber: DeviceInfo.getBuildNumber?.() || '',
      estimatedWaitTime: estimatedWaitTime || 0,
      rideMatchVersion: '2.0',
    };

    if (couponCode) {
      payload.offerCoupon = couponCode;
    }

    return payload;
  };

  const bookTrip = async (customData = null) => {
    try {
      if (!rideStartLocation || !rideEndLocation) {
        throw new Error(t('please_select_start_end_locations'));
      }
      if (!actingDriverVehicle) {
        throw new Error(t('vehicle_selection_required'));
      }
      if (!paymentType) {
        throw new Error(t('please_select_payment_method'));
      }

      setIsLoading(true);
      setIsError(false);
      setError(null);

      const payload = customData || prepareBookingPayload();
      console.log('Acting driver booking payload:', JSON.stringify(payload));

      const response = await bookActingDriverTrip(payload);
      setData(response);

      if (response?.success) {
        resetRideMatchStatus();
        setTripStatus(TripStatus.PENDING);
        incrementTotalTrips();
        setCurrentRideInfo(response);
        const tripId = response?._id || response?.tripId || null;
        setActiveTripId(tripId);
        firebaselog_tripBooking('TB_Booking(TB_B)', 'TB_B:acting_driver_booking_success');
        if (onSuccess) await onSuccess(response);
      } else {
        firebaselog_tripBooking('TB_Booking(TB_B)', 'TB_B:acting_driver_booking_failed');
        showNotification(t('booking_failed'), t('failed_to_book_ride'), 'danger');
        if (onError) await onError(response);
      }

      return response;
    } catch (err) {
      console.error('Acting driver booking error:', err);
      setIsError(true);
      setError(err);
      const msg = err?.message?.message || err?.message || t('failed_to_book_ride');
      showNotification(t('booking_error'), msg, 'danger');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isBookingReady = () =>
    !!(rideStartLocation && rideEndLocation && actingDriverVehicle && paymentType);

  const getBookingValidationErrors = () => {
    const errors = [];
    if (!rideStartLocation) errors.push(t('start_location_required'));
    if (!rideEndLocation) errors.push(t('end_location_required'));
    if (!actingDriverVehicle) errors.push(t('vehicle_selection_required'));
    if (!paymentType) errors.push(t('payment_method_required'));
    return errors;
  };

  return {
    isLoading,
    isError,
    error,
    data,
    bookTrip,
    prepareBookingPayload,
    isBookingReady,
    getBookingValidationErrors,
    bookingData: {
      startLocation: rideStartLocation,
      endLocation: rideEndLocation,
      wayPoints: rideWayPoints,
      actingDriverVehicle,
      paymentType,
      rideDistance,
      estimatedDuration,
      actingDriverHours,
    },
  };
};

export default useActingDriverBookingService;
