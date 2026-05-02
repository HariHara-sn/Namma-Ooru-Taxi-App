import { useState } from 'react';
import DeviceInfo from 'react-native-device-info';
import { useTranslation } from 'react-i18next';
import { bookRide } from '../../../API/EndPoints/EndPoints';
import { showNotification } from '../../../components/NotificationManger';
import useRideBookingLocationStore from '../store/useRideBookingLocationStore';
import useRideBookingInfo from '../store/useRideBookingInfo';
import useRideVehicleStore from '../store/useRideVehicleStore';
import useRideMatchStore from '../../rideStatus/store/useRideMatchStore';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import useCurrentRideInfoStore from '../../rideStatus/store/useCurrentRideInfoStore';
import { TripStatus } from '../../rideStatus/types/TripStatus';
import { utils } from '../../../utils/Utils';
import { DataStore } from '../../../controllers/DataStore';
import { firebaselog_tripBooking } from '../../../../common/utils/FirebaseAnalytics';
/**
 * Hook to handle trip booking with API integration
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 * @returns {Object} Booking mutation and state
 */
const useBookingService = ({ onSuccess, onError } = {}) => {
  const { t } = useTranslation();
  const { 
    rideStartLocation, 
    rideEndLocation, 
    rideWayPoints 
  } = useRideBookingLocationStore();
  
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
    isScheduledTrip,
    scheduleDateTime,
    actingDriverHours,
    actingDriverVehicle,
  } = useRideBookingInfo();

  
  
  const { selectedVehicle } = useRideVehicleStore();
  const { resetRideMatchStatus } = useRideMatchStore();
  // const { initializeSocket, startMatching } = useRideMatching();
  // const { id: userId } = useUserInfoStore();
  const { setCurrentRideInfo,setTripStatus } = useCurrentRideInfoStore();
  const { incrementTotalTrips, setActiveTripId } = useUserInfoStore();
  /**
   * Prepare booking payload with dummy values for testing
   * @returns {Object} Formatted payload for booking API
   */


  const storeInRecentTrips = async (item) => {
    
        try {
          if(!item) return;

          // console.log("Item to store in recent trips:", item);

          if( (item?.name && item?.name == "Unnamed Location") || (item?.placeName && item?.placeName == "Unnamed Location") ) {
           
            return;
           
          }

          if( item?.placeName  ) {
          item["name"]=item?.placeName 
          }

          if( item?.address  ) {
          item["address"]=utils.formatArrayAddress(item?.address)

          }

          console.log("Storing in recent trips:", item);
          const recentSearches = await DataStore.loadData('recentSearches');
          let updatedSearches = [];
          // console.log("Loaded recent searches:", recentSearches);
    
          if (recentSearches && recentSearches.data) {
            // Check if item already exists
            const exists = recentSearches.data.some(search => search.name === item.name);
            
            if (!exists) {
              // Add new item to start of array, limit to 5 items
              updatedSearches = [item, ...recentSearches.data].slice(0, 5);
            } else {
              // Move existing item to start
              updatedSearches = [
                item,
                ...recentSearches.data.filter(search => search.name !== item.name)
              ].slice(0, 5);
            }
          } else {
            updatedSearches = [item];
          }
    
          await DataStore.storeData('recentSearches', updatedSearches);
       
        } catch (error) {
          console.error("Error storing recent search:", error);
        }
      }
  const prepareBookingPayload = () => {
    // Validate required data
    if (!rideStartLocation || !rideEndLocation) {
      throw new Error(t('start_end_locations_required'));
    }

    // console.log("selectedVehicle",selectedVehicle)

    const isActingDriver = actingDriverVehicle != null;
    if (!selectedVehicle && !isActingDriver) {
      throw new Error(t('vehicle_selection_required'));
    }

    // Prepare stops array with start, waypoints, and end locations
          const stops = [
        {
          name: 'Pickup Point',
          location: [rideStartLocation.longitude, rideStartLocation.latitude],
          address: utils.formatAddressName(rideStartLocation),
          waitingTime: 0,
          isReached:false
        }
      ];

    // Add waypoints if any
    if (rideWayPoints && rideWayPoints.length > 0) {
      rideWayPoints.forEach((waypoint, index) => {
        stops.push({
          name: `${'Stop'} ${index + 1}`,
          location: [waypoint.longitude, waypoint.latitude],
          address: utils.formatAddressName(waypoint),
          waitingTime: waypoint.waitingTime || 0,
          isReached:false
        });
      });
    }

    // Add end location
    stops.push({
      name: 'Drop Point',
      location: [rideEndLocation.longitude, rideEndLocation.latitude],
      address: utils.formatAddressName(rideEndLocation),
      waitingTime: 0,
      isReached:false
    });

    storeInRecentTrips(rideEndLocation);


      



    
    console.log(selectedVehicle,"selectedVehicle in prepareBookingPayload")

    const estimatedWaitTime = stops.map((stop) => stop.waitingTime || 0).reduce((a, b) => a + b, 0);
    

    // Build payload with dummy values for testing
    const payload = {
      // Location data
      startLocation: [rideStartLocation.longitude, rideStartLocation.latitude],
      endLocation: [rideEndLocation.longitude, rideEndLocation.latitude],
      stops: stops,
      isScheduledTrip: isScheduledTrip,

      // Vehicle and trip data
      vehicleType: (actingDriverVehicle != null ? actingDriverVehicle?.type : selectedVehicle?.type) || 'AUTO',
      passangerCount: 1, 
      // Pricing data
      minFare: actingDriverVehicle != null ? undefined : selectedVehicle?.minFare, 
      estimatedDistance: rideDistance,
      estimatedDuration: estimatedDuration, 
      maxFare: actingDriverVehicle != null ? undefined : selectedVehicle?.maxFare, 
      
      // Booking details
      bookingFor: rideBookMode, // Dummy value
      bookingForName: passangerDetails?.name || 'John Doe', // Dummy name
      bookingForPhone: passangerDetails?.phone || '+919876543210', // Dummy phone
      
      // Payment method
      paymentMethod: paymentType || 'CASH',
      nightRide:safeNightRides,
      femaleOnly:femaleDriverOnly,
      regionalOffice: regionOfficeId || null,
      regionCode: regionOfficeCode || 'default',
      appVersion: (DeviceInfo.getVersion?.() || ''),
      buildNumber: (DeviceInfo.getBuildNumber?.() || ''),
      estimatedWaitTime : estimatedWaitTime || 0,
      rideMatchVersion : '2.0'
     
      
    };

    if (actingDriverVehicle != null) {
      payload.actingDriverHours = actingDriverHours;
      payload.isActingDriverTrip = true;
      if (actingDriverVehicle) {
        payload.passangerVehicleId = actingDriverVehicle._id;
        payload.passangerVehicleType = actingDriverVehicle.type;
      }
    }

    if (isScheduledTrip) {
      if (scheduleDateTime?.date && scheduleDateTime?.time) {
        const dateObj = new Date(scheduleDateTime.date);
        const timeObj = new Date(scheduleDateTime.time);
        if (!isNaN(dateObj) && !isNaN(timeObj)) {
          dateObj.setHours(timeObj.getHours());
          dateObj.setMinutes(timeObj.getMinutes());
          dateObj.setSeconds(0);
          dateObj.setMilliseconds(0);
          payload.scheduleDateTime = dateObj.getTime();
        }
      }
    }
    if(couponCode){
      payload.offerCoupon = couponCode
    }

    
    return payload;
  };

  /**
   * Booking mutation using react-query
   */
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * Book trip with validation
   * @param {Object} customData - Optional custom data to override defaults
   * @returns {Promise} Booking result
   */
  const bookTrip = async (customData = null) => {
    try {
      // Validate required data before booking
      if (!rideStartLocation || !rideEndLocation) {
        throw new Error(t('please_select_start_end_locations'));
      }

      if (!selectedVehicle && actingDriverVehicle == null) {
        throw new Error(t('please_select_vehicle'));
      }

      if (!paymentType) {
        throw new Error(t('please_select_payment_method'));
      }
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const payload = customData || prepareBookingPayload();
      console.log('Booking payload:', JSON.stringify(payload));

      const response = await bookRide(payload);
      setData(response);

      if (response?.success) {
        resetRideMatchStatus();
        setTripStatus(TripStatus.PENDING);
        incrementTotalTrips();
        setCurrentRideInfo(response);
        const tripId = response?._id || response.tripId || null;
        console.log("Booked Trip ID:", tripId);
        setActiveTripId(tripId);
        firebaselog_tripBooking('TB_Booking(TB_B)','TB_B:trip_booking_success')

        if (onSuccess) {
          await onSuccess(response);
        }
      } else {
        firebaselog_tripBooking('TB_Booking(TB_B)','TB_B:trip_booking_failed')
        showNotification(
          t('booking_failed'),
          t('failed_to_book_ride'),
          'danger'
        );
        if (onError) {
          await onError(response);
        }
      }

      return response;
      
    } catch (error) {
      console.error('Booking validation error:', error);
      setIsError(true);
      setError(error);
      const errorMessage = error?.message?.message || error?.message || t('failed_to_book_ride');
      showNotification(t('booking_error'), errorMessage, 'danger');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if booking is ready (all required data is available)
   * @returns {boolean} Whether booking can proceed
   */
  const isBookingReady = () => {
    const isActingDriver = actingDriverVehicle != null;
    return !!(
      rideStartLocation && 
      rideEndLocation && 
      (selectedVehicle || isActingDriver) && 
      paymentType
    );
  };

  /**
   * Get booking validation errors
   * @returns {Array} Array of validation error messages
   */
  const getBookingValidationErrors = () => {
    const errors = [];
    // console.log("selectedVehicle",selectedVehicle)
    const isActingDriver = actingDriverVehicle != null;
    if (!rideStartLocation) errors.push(t('start_location_required'));
    if (!rideEndLocation) errors.push(t('end_location_required'));
    if (!selectedVehicle && !isActingDriver) errors.push(t('vehicle_selection_required'));
    if (!paymentType) errors.push(t('payment_method_required'));
    
    return errors;
  };

  return {
    // Mutation state
    isLoading,
    isError,
    error,
    data,
    
    // Actions
    bookTrip,
    prepareBookingPayload,
    
    // Validation
    isBookingReady,
    getBookingValidationErrors,
    
    // Current booking data
    bookingData: {
      startLocation: rideStartLocation,
      endLocation: rideEndLocation,
      wayPoints: rideWayPoints,
      selectedVehicle,
      paymentType,
      rideDistance,
      estimatedDuration
    }
  };
};

export default useBookingService; 