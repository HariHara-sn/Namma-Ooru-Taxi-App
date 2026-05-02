/* eslint-disable react/no-children-prop */
/* eslint-disable react/jsx-no-undef */
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import React, { useEffect, useState }  from 'react';
import StarRating from 'react-native-star-rating-widget';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useTripsStore from '../store/useTripsStore';
import { useTripAcceptStore } from '../store/useTripAcceptStore';
import useUserStore from '../../common/store/useUserStore';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import useCurrentScreenStore from '../../common/store/useCurrentScreenStore';
import usePublicDriverStore from '../store/usePublicDriverStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import APIRequest from '../../common/APIRequest';
import { DataStore } from '../../common/controllers/DataStore';
import { showNotification } from '../../common/components/Alerts/showNotification';
import { RouteScreenStyles } from '../styles/RouteScreenStyles';
import DriverOnRide from './DriverOnRide';
import { Colors, Fonts } from '../../common/constants/constants';
import PublicDriverTripPaymentScreen from './PublicDriverTripPaymentScreen';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import { firebaselog_onRide, firebaselog_tripCompletion, firebaselog_tripReview, firebaselog_tripPayment } from '../../common/utils/FirebaseAnalytics';

const PublicDriverTrackingScreen = () => {
  const {
    activeTripData,
    setActiveTripData,
    setFareBreakDown,
    newStopData,
    setNewStopData,
  } = useTripsStore();
  const {setHasActiveTrip} = useTripAcceptStore();
  const [isLoading, setIsLoading] = useState(false)
  const {userInfo} = useUserStore()
  const {setStackScreen} = useStackScreenStore()
  const {setCurrentScreen} = useCurrentScreenStore()
  const [isRatingLoading, setIsRatingLoading] = useState(false)
  const [comments, setcomments] = useState('')
  const [rating, setRating] = useState(5)
  const {isOnGoing, setIsOnGoing, setIsGetFare} = useTripAcceptStore()
  const {updateDriverDue, driverRole, setdriverDueDate, setShowRatingModal, showRatingModal} = usePublicDriverStore();
  const {setDirectionPoints, setDisduration, setStartNavigation} = useMapMarkerStore();

  const tripsStatus = activeTripData && activeTripData[0]?.status ? activeTripData[0]?.status : "";

  const onPaymentReceive = async (fareDetails, paymentMethod) => {
    
    setIsLoading(true);
    try {
      const api = new APIRequest();
      const url = `/publicrides/driver/v2/updatePaymentReceive`;
      const payload = {
        tripId: activeTripData?.[0]?._id,
        fareDetails: fareDetails,
        status: isOnGoing ? 'DIVERGED' : 'COMPLETED',
        paymentMethod:paymentMethod,
        role:driverRole
      };
      const res = await api.request(
        url,
        'POST',
        payload,
        userInfo?.token,
      );
      if (res?.success) {
          const updatedRideGroup = {...activeTripData[0], status: isOnGoing ? 'DIVERGED' : 'COMPLETED'};
          setActiveTripData([updatedRideGroup]);
          DataStore.storeData('activeTripId', null)
          DataStore.storeData('isOngoingTrip', null)
          if (driverRole === 'dco') {
            const newDriverDue = fareDetails?.breakdown?.driverDue;
            updateDriverDue(newDriverDue)
            setdriverDueDate(res?.nextDueDate)
          }
          setFareBreakDown(null)
          setShowRatingModal(true)
          setIsGetFare(true)
          setIsOnGoing(false)
          setHasActiveTrip(null)
          setDirectionPoints(null) 
          setDisduration(null)
          setStartNavigation(false)
          firebaselog_tripCompletion('TP_Cash(TP_C)', `TP_C:payment_received_by_driver`)
             firebaselog_tripPayment('TP_complete', `TP_R:TP_complete`)
          showNotification(res?.message, res?.message, 'success');
      } else {
        firebaselog_tripCompletion('TP_Cash(TP_C)', `TP_C:payment_received_failed`)
        showNotification(res?.error, res?.message, 'danger');
      }
      setIsLoading(false);
    } catch (error) {
      firebaselog_tripCompletion('TP_Cash(TP_C)', `TP_C:payment_received_failed`)
      showNotification('Something went wrong', '', 'danger');
      setIsLoading(false);
    }
  }

  const onRatingClose = () => {
    if (activeTripData && activeTripData?.[0]?.status === "ACCEPTED") {
      setShowRatingModal(false)
    } else {
      setShowRatingModal(false)
     setActiveTripData([])
    setHasActiveTrip(null)
    setStackScreen('Home')
    setCurrentScreen('Map')
    }
  }

  const updatePassangerRating= async() => {
    setIsRatingLoading(true);
    try {
      const api = new APIRequest();
      const url = `/publicrides/driver/v2/driverPassengerRating`;
      const payload = {
        tripId:activeTripData?.[0]?._id,
        rating:rating,
        comment: comments
    };
      const res = await api.request(
        url,
        'POST',
        payload,
        userInfo?.token,
      );
      if (res?.success) {
        showNotification(res?.message, res?.message, 'success');
        firebaselog_tripReview('TR_Rating(TR_R)', `TR_R:submit_driver`)
        onRatingClose()
      } else {
        firebaselog_tripReview('TR_Rating(TR_R)', `TR_R:failed_driver`)
        showNotification(res?.message, res?.message, 'danger');
      }
      setIsRatingLoading(false);
    } catch (error) {
      firebaselog_tripReview('TR_Rating(TR_R)', `TR_R:failed_driver`)
      showNotification('Something went wrong', '', 'danger');
      setIsRatingLoading(false);
    }
  }

  const RATING_LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

  const renderRatingModal = () => (
    <Modal visible={showRatingModal} transparent animationType="slide">
      <View style={ratingStyles.overlay}>
        <View style={ratingStyles.card}>
          {/* Close */}
          <TouchableOpacity style={ratingStyles.closeBtn} onPress={onRatingClose}>
            <Ionicons name="close" size={22} color={Colors.black} />
          </TouchableOpacity>

          {/* Emoji */}
          <View style={ratingStyles.emojiCircle}>
            <Ionicons name={rating >= 4 ? 'happy' : rating >= 3 ? 'happy-outline' : 'sad-outline'} size={40} color={Colors.periwinkle} />
          </View>

          <Text style={ratingStyles.title}>Rate Passenger</Text>
          <Text style={ratingStyles.ratingLabel}>{RATING_LABELS[Math.round(rating)] || ''}</Text>

          <StarRating
            rating={rating}
            onChange={setRating}
            starSize={36}
            color={Colors.periwinkle}
            starStyle={{marginHorizontal: 4}}
          />

          {/* Comment */}
          <TextInput
            style={ratingStyles.commentInput}
            placeholder="Add a comment (optional)"
            placeholderTextColor="#BDBDBD"
            value={comments}
            onChangeText={setcomments}
            multiline
            maxLength={200}
          />

          {/* Buttons */}
          <View style={ratingStyles.btnRow}>
            <TouchableOpacity style={ratingStyles.skipBtn} onPress={onRatingClose}>
              <Text style={ratingStyles.skipBtnTxt}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ratingStyles.submitBtn} disabled={isRatingLoading} onPress={updatePassangerRating}>
              {isRatingLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={ratingStyles.submitBtnTxt}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  useEffect(()=> {
    const getIsOnGoingTrip = async() => {
      try {
        const isOnGoing = await DataStore.loadData('isOngoingTrip')
        if (isOnGoing?.status) {
          setIsOnGoing(isOnGoing.data)
        } else {
          setIsOnGoing(false)
        }
      }
      catch (e){
        console.log('hari-->>error-->>isOnGoingTrip-->>', e)
      }
    } 
    getIsOnGoingTrip()
  },[])

  // useEffect(() => {
  //   if (!newStopData) {
  //     return;
  //   }

  //   // Defer navigation so we don't mutate navigation state while React renders
  //   const timer = setTimeout(() => {
  //     setStackScreen('StopChangeRequest');
  //     // setNewStopData(null);
  //   }, 100);
  //   return () => clearTimeout(timer);
  // }, [newStopData, setStackScreen, setNewStopData]);

  const renderTripStatusComponent = () => {
     if (newStopData) {
      return setStackScreen('StopChangeRequest');
     }
     if (tripsStatus === 'ACCEPTED' || tripsStatus === 'PICKEDUP') {
      return <DriverOnRide />
     }
      if (tripsStatus === 'DROPPED' || tripsStatus === 'PAYMENT_COMPLETED' || isOnGoing) {
      return <PublicDriverTripPaymentScreen onPaymentReceive={(fareDetails, paymentMethod)=>onPaymentReceive(fareDetails, paymentMethod)} tripDetials={activeTripData[0]} isLoading={isLoading}/>
     }
  }

  return (
    <>
    {(isRatingLoading )&&
    <View style={{position:'absolute', width:'100%', height:'100%', zIndex:99999}}>
    <FullScreenLoader /> 
    </View>
    }
    <View style={{flex: 1}}>
      {!activeTripData || activeTripData?.length === 0 ? (
         <View style={RouteScreenStyles.noActiveRouteContainer}>
         <Text style={RouteScreenStyles.noActiveRouteTxt}>
           No Active Trip !!
         </Text>
         <TouchableOpacity style={RouteScreenStyles.goHomeBtn} onPress={()=>setStackScreen('Home')}> 
           <Text style={RouteScreenStyles.goHomeBtnTxt}>Go Home</Text>
         </TouchableOpacity>
       </View>
      ) : (
        renderTripStatusComponent()
      )}
      {showRatingModal && renderRatingModal()}
    </View>
    </>
  );
};

export default PublicDriverTrackingScreen;

const ratingStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 4,
  },
  emojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0ECFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: Colors.black,
    marginBottom: 4,
  },
  ratingLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.periwinkle,
    marginBottom: 14,
  },
  commentInput: {
    width: '100%',
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 18,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.black,
    textAlignVertical: 'top',
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
    width: '100%',
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  skipBtnTxt: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.black,
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.periwinkle,
    alignItems: 'center',
    elevation: 3,
    shadowColor: Colors.periwinkle,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitBtnTxt: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    color: Colors.white,
  },
});
