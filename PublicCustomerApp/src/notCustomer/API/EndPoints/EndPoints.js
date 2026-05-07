import {Platform} from 'react-native';
import Config from 'react-native-config';
import axios from 'axios';
import apiClient from '../APIClient';

// request OTP
export const requestOTP = async payload => {
  const {data} = await apiClient.post(
    `/publicrides/customer/v2/login?isdev=${true}`,
    payload,
  );
  // const data = {
  //   success: true,
  //   message: 'OTP Sent',
  // };
  return data;
};

export const requestDriverOTP = async payload => {
  const {data} = await apiClient.post(
    `/publicrides/driver/v2/sendOTP?platform=${Platform.OS}&isdev=${true}`,
    payload,
  );
  console.log('driver otp data', data);
  return data;
};

export const verifyDriverOTP = async payload => {
  const {data} = await apiClient.post(
    `/publicrides/driver/v2/verifyOTP?platform=${Platform.OS}&isdev=${true}`,
    payload,
  );
  return data;
};

// export const verifyActingDriverOTP = async (payload) => {
//   const { data } = await apiClient.post(`/publicrides/actingDriver/v2/verifyADOTP?platform=${Platform.OS}`, payload);
//  return data;
// }

// verify OTP
export const verifyOTP = async payload => {
  const {data} = await apiClient.post(
    `publicrides/customer/v2/verifyotp?isdev=${true}`,
    payload,
  );
  console.log('verify otp response', data);
  return data;
};

// user profile update
export const profileUpdate = async payload => {
  const {data} = await apiClient.post('/customer/profile/update', payload);
  return data;
};

// get user details
export const getUserDetails = async () => {
  const {data} = await apiClient.get('/customer/profile/get-details');
  return data;
};

export const getAvaliableCoupons = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/getPassengerAvaliableCoupons',
    payload,
  );
  return data;
};

// get ride estimate
export const getRideEstimation = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/getRideEstimation',
    payload,
  );
  return data;
};

export const getFareEngineRange = async payload => {
  const fareEngineBaseURL = (
    Config.FARE_ENGINE_URL || 'http://10.0.2.2:3001'
  ).replace(/\/+$/, '');

  const {data} = await axios.get(`${fareEngineBaseURL}/api/fare/range`, {
    params: payload,
    timeout: 10000,
  });
  return data;
};

export const updateTripStops = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/tripStopsChange',
    payload,
  );
  return data;
};

export const submitTripFeedback = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/passengerDriverRating',
    payload,
  );
  return data;
};

// submit general app feedback
export const submitAppFeedback = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/submitFeedback',
    payload,
  );
  return data;
};

// Book Ride
export const bookActingDriverTrip = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/bookActingDriverTrip',
    payload,
  );
  return data;
};

export const bookRide = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/bookTrip',
    payload,
  );
  return data;
};

// cancel Ride

export const getUserStats = async currentTripId => {
  let url = `/publicrides/customer/v2/getUserStats`;
  if (currentTripId !== null && currentTripId !== undefined) {
    url += `?currentTripId=${currentTripId}`;
  }
  console.log('Fetching user stats from URL:', url);
  const {data} = await apiClient.get(url);
  return data;
};

export const getCurrentTrip = async () => {
  console.log('Fetching current trip from server');
  const {data} = await apiClient.get('/publicrides/customer/v2/getTrip');

  return data;
};

export const getAvalibaleVehiclesType = async (lat, lon) => {
  const {data} = await apiClient.get(
    `/publicrides/customer/v2/getAvaliableVehicleInfo?latitude=${lat}&longitude=${lon}`,
  );
  return data;
};

export const cancelRide = async payload => {
  const {data} = await apiClient.post(
    'publicrides/customer/v2/rideCancelByPassenger',
    payload,
  );
  return data;
};

export const updatePaymentInServer = async payload => {
  const {data} = await apiClient.post(
    'publicrides/customer/v2/paymentStatusUpdate',
    payload,
  );
  return data;
};

// get nearby drivers
export const getNearByDrivers = async (lat, lon, radius, vehicleTypes) => {
  const {data} = await apiClient.get(
    `/publicrides/customer/v2/getNearByDrivers?latitude=${lat}&longitude=${lon}&radius=${radius}&vehicleTypes=${vehicleTypes.join(
      ',',
    )}`,
  );
  return data;
};

export const getPreFinalFare = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/getPreFinalFare',
    payload,
  );
  return data;
};
export const passangerStopChangeRequest = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/passangerStopChangeRequest',
    payload,
  );
  return data;
};

// get customer trips
export const getCustomerTrips = async payload => {
  console.log('payload', payload);

  const {data} = await apiClient.get('/publicrides/customer/v2/getTrips', {
    params: payload,
  });
  return data;
};

export const addFavoritePlace = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/addFavPlaces',
    payload,
  );
  return data;
};

export const deleteFavoritePlace = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/deleteFavPlaces',
    payload,
  );
  return data;
};

export const mapMatch = async payload => {
  const {data} = await apiClient.post(`${Config.MAP_MATCH_URL}`, payload);
  return data;
};

// get ticket categories
export const getTicketCategories = async () => {
  const {data} = await apiClient.get(
    '/publicrides/customer/v2/getTicketCategories',
  );
  return data;
};

// delete account
export const deleteAccount = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/getPassengerAccountDeletion',
    payload,
  );
  return data;
};

export const getTripDetails = async tripId => {
  const {data} = await apiClient.get(
    `/publicrides/customer/v2/getTripPaymentDetails?tripId=${tripId}`,
  );
  return data;
};

export const createOrder = async payload => {
  console.log(payload);
  const {data} = await apiClient.post(
    '/publicrides/payments/customer/create-order',
    payload,
  );
  return data;
};

export const makeMaskedCallToDriver = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/makeMaskedCallToDriver',
    payload,
  );
  return data;
};

// report passenger payment issues
export const passengerPaymentIssues = async payload => {
  // expects { tripId, passengerIssues }
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/passengerPaymentIssues',
    payload,
  );
  return data;
};

// Trigger SOS
export const triggerSOS = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/sosTriggered',
    payload,
  );
  return data;
};

// confirm trip status (customer reported)
export const confirmTripStatus = async payload => {
  // expects { tripId, tripStatus }
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/confirmTripStatus',
    payload,
  );
  return data;
};

// get passenger trip stats (totals, spend, etc.)
export const getPassengerTripStats = async () => {
  const {data} = await apiClient.get(
    '/publicrides/customer/v2/getPassengerTripStats',
  );
  return data;
};

export const updateFcmTokenAPI = async payload => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/updateFCMToken',
    payload,
  );
  return data;
};

export const updatePassangerVehicle = async vehicleInfo => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/updatePassangerVehicle',
    {vehicleInfo},
  );
  return data;
};

export const getPassangerVehicles = async () => {
  const response = await apiClient.get(
    '/publicrides/customer/v2/getPassangerVehicles',
  );
  if (response.status === 304) {
    return {success: true, status: 304, vehicles: undefined};
  }
  return response.data;
};

export const editPassangerVehicle = async (vehicleId, vehicleInfo) => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/editPassangerVehicle',
    {vehicleId, vehicleInfo},
  );
  return data;
};

export const deletePassangerVehicle = async vehicleId => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/deletePassangerVehicle',
    {vehicleId},
  );
  return data;
};

export const approveBill = async (tripId, billIndex, approval) => {
  const {data} = await apiClient.post('/publicrides/customer/v2/approveBill', {
    tripId,
    billIndex,
    approval,
  });
  return data;
};

export const markBillAsPaid = async (tripId, billIndex) => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/markBillAsPaid',
    {tripId, billIndex},
  );
  return data;
};

export const uploadPaymentReceipt = async (tripId, billIndex, imageAsset) => {
  const formData = new FormData();
  formData.append('tripId', tripId);
  formData.append('billIndex', String(billIndex));
  formData.append('paymentReceipt', {
    uri: imageAsset.uri,
    type: imageAsset.type || 'image/jpeg',
    name: imageAsset.fileName || `payment_receipt_${Date.now()}.jpg`,
  });
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/uploadPaymentReceipt',
    formData,
    {
      headers: {'Content-Type': 'multipart/form-data'},
    },
  );
  return data;
};

export const updateNotificationPreferences = async (
  notificationPreferences,
  tripId,
) => {
  const {data} = await apiClient.post(
    '/publicrides/customer/v2/updateNotificationPreferences',
    {notificationPreferences, ...(tripId ? {tripId} : {})},
  );
  return data;
};
