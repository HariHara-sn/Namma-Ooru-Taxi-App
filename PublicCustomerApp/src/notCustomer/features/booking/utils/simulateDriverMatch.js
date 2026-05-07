import Config from 'react-native-config';

import {TripStatus} from '../../rideStatus/types/TripStatus';
import useAssignedDriverInfoStore from '../../rideStatus/store/useAssignedDriverInfoStore';
import useCurrentRideInfoStore from '../../rideStatus/store/useCurrentRideInfoStore';
import useRideMatchStore from '../../rideStatus/store/useRideMatchStore';

const isTruthy = value => value === true || String(value).toLowerCase() === 'true';

export const isDriverMatchSimulationEnabled = () =>
  isTruthy(Config.SIMULATE_DRIVER_MATCH) ||
  ((typeof globalThis !== 'undefined' && globalThis.__DEV__ === true) &&
    isTruthy(Config.DEV));

const getPickupLocation = trip => {
  const firstStop = trip?.stops?.[0];
  const location = firstStop?.location || trip?.startLocation || [];
  const longitude = Number(location?.[0]) || 77.143047;
  const latitude = Number(location?.[1]) || 11.177551;

  return [longitude + 0.001, latitude + 0.001];
};

const getEstimatedFare = trip => {
  if (typeof trip?.estimatedFare === 'number') {
    return trip.estimatedFare;
  }
  if (typeof trip?.maxFare === 'number') {
    return trip.maxFare;
  }
  if (typeof trip?.minFare === 'number') {
    return trip.minFare;
  }
  return null;
};

export const simulateDriverMatch = (bookingResult, vehicleType) => {
  const trip = bookingResult?.trip || bookingResult || {};
  const tripId = trip?._id || bookingResult?.tripId || bookingResult?._id;
  const driverLocation = getPickupLocation(trip);
  const otp = String(trip?.otp || '1122');
  const estimatedFare = getEstimatedFare(trip);
  const resolvedVehicleType = vehicleType || trip?.vehicleType || 'AUTO';

  const driverInfo = {
    driverName: 'Test Driver',
    driverRating: 4.8,
    driverPhone: '9999999999',
    vehicleNumber: 'KA 01 TEST',
    vehicleModel: resolvedVehicleType,
    vehicleBrand: 'Namma Ooru Taxi',
    vehicleColor: 'White',
    driverLocation: {
      type: 'Point',
      coordinates: driverLocation,
    },
    upiId: '9999999999@upi',
  };

  useAssignedDriverInfoStore.getState().setAllocatedDriverInfo(driverInfo);
  useCurrentRideInfoStore.getState().setCurrentRideInfo({
    ...trip,
    _id: tripId,
    status: TripStatus.ACCEPTED,
    otp,
    estimatedFare,
  });
  useCurrentRideInfoStore.getState().setTripStatus(TripStatus.ACCEPTED);
  useCurrentRideInfoStore.getState().setOtp(otp);
  useCurrentRideInfoStore.getState().setEstimatedFare(estimatedFare);

  useRideMatchStore.getState().setRideMatchStatus({
    status: 'MATCHED',
    message: 'Simulated driver accepted the ride',
    driver: {
      name: driverInfo.driverName,
      location: driverLocation,
    },
  });
  useRideMatchStore.getState().setDriverMatched(true);

  return {
    status: 'MATCHED',
    trip_detail: {
      ...trip,
      _id: tripId,
      status: TripStatus.ACCEPTED,
      otp,
      estimatedFare,
      driver_info: driverInfo,
    },
  };
};
