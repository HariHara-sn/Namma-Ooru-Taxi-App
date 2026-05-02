import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  View,
  StyleSheet,   
  TouchableOpacity,
  Pressable,
} from 'react-native';
import PropTypes from 'prop-types';
import { useStackScreenStore } from '../../../store/useStackScreenStore';

import RatingBox from '../components/RatingBox';    
import TripPersonVehicle from '../../rideHistory/components/TripPersonVehicle';
import RideStatusHeader from '../../rideStatus/components/RideStatusHeader';
import { Fonts, colors       } from '../../../constants/constants';
import { utils } from '../../../utils/Utils';
import { submitTripFeedback } from '../../../API/EndPoints/EndPoints';
import { showNotification } from '../../../components/NotificationManger';
import { useTranslation } from 'react-i18next';
import { DataStore } from '../../../controllers/DataStore';
import PREF from '../../../storage/PREF';
import { getTripDetails } from '../../../API/EndPoints/EndPoints';
import useRatingStore from '../Store/useRatingStore';
import LottieView from 'lottie-react-native';
import { height ,width } from '../../../utils/Utils';
import AdaptiveText from '../../../components/Common/AdaptiveText';
// import triggerInAppReview from '../../../utils/inAppReview/triggerInAppReview';
import InAppReview from 'react-native-in-app-review';
import { firebaselog_tripReview } from '../../../../common/utils/FirebaseAnalytics';
import  useUserInfoStore  from '../../../../common/store/useUserInfoStore';
import useConfigStore from '../../../store/useConfigStore';
import Social from '../components/Social';
import usePaymentStore from '../../payment/store/usePaymentStore';

export default function TripFeedbackScreen() {
  
    
  const {tripFare,tripDistance,tripDuration,driverDetails,currentTripId,setTripDetails,isLoading,setIsLoading,tripStatus } = useRatingStore();

    const { resetEverything } = usePaymentStore();
    const bounceValue = useRef(new Animated.Value(height)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const { reset,setShowSocialMediaModal } = useStackScreenStore();
    const { setActiveTripId ,completedTrips} = useUserInfoStore();
    const {t} = useTranslation();
    const { appConfig } = useConfigStore();  

    const [minDelayDone, setMinDelayDone] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setMinDelayDone(true), 3000);
      return () => clearTimeout(timer);
    }, []);


    const showsocialMediaModal = () =>{
      setShowSocialMediaModal(true);

    }


    const triggerInAppReview = async () => {
    firebaselog_tripReview('Trip_IN_APP_Review_TR','Trip_IN_APP_R:triggered')
    if (InAppReview.isAvailable()) {
      console.log('In-App Review is available on this device',InAppReview.isAvailable());
      try { 
        const hasFlowFinishedSuccessfully = await InAppReview.RequestInAppReview();
        console.log('In-App Review flow finished successfully:', hasFlowFinishedSuccessfully);
        return !!hasFlowFinishedSuccessfully;
      } catch (error) {
        console.log('Error during In-App Review process:', error?.message || error);
        return false;
      }
    } else {
      console.log('In-App Review not available on this device');
      return false;
    }
  };


    const OnClose = async () => {
    await DataStore.clearData(PREF.CURRENT_TRIP)
    resetEverything()
    setActiveTripId(null);
    reset()
    console.log("appConfig?.IN_APP_REVIEW_ALWAYS",appConfig?.IN_APP_REVIEW_ALWAYS)
    console.log("completedTrips",completedTrips)
    if(appConfig?.IN_APP_REVIEW_ALWAYS && completedTrips >=1){
      console.log("Triggering In App Review on close")
      triggerInAppReview();
    }
    // showsocialMediaModal();
  }

  

    const fetchTripDetails = async () => {
      const storedTripId = await DataStore.loadData(PREF.CURRENT_TRIP);
      if(!storedTripId?.data){
        OnClose();
        return;
      }

      const attemptFetch = async () => {
        try {
          return await getTripDetails(storedTripId.data);
        } catch (e) {
          return { success: false, error: e };
        }
      };

      // First attempt
      let tripDetails = await attemptFetch();

      if(!tripDetails?.success){
        // Delay then one retry
        await new Promise(r => setTimeout(r, 1500));
        tripDetails = await attemptFetch();
      }

      if(tripDetails?.success){
        setTripDetails(tripDetails);
        setIsLoading(false);
      } else {
        OnClose();
      }
    };
  
    useEffect(()=>{
      fetchTripDetails();
      resetEverything();
      
    },[])

  useEffect(() => {
    Animated.parallel([
      Animated.spring(bounceValue, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 12,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);


  

  const handleSubmit = async (ratingData) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    ratingData.tripId = currentTripId

    console.log("ratingData before submit",ratingData)

    


    console.log("ratingData",ratingData)
    try{
    
    const feedback = await submitTripFeedback(ratingData)

    
   
    if(feedback.success){
      firebaselog_tripReview('Trip_Review_TR','TR_R:submit_customer')
      console.log("appConfig?.IN_APP_REVIEW_ALWAYS",appConfig?.IN_APP_REVIEW_ALWAYS)
      console.log("appConfig?.IN_APP_REVIEW_REQUIRED_RATING",appConfig?.IN_APP_REVIEW_REQUIRED_RATING)
      // showNotification(t('success'),t('feedback_submitted_successfully'),"success")
       
      if(appConfig?.IN_APP_REVIEW_REQUIRED_RATING && ratingData.rating >=appConfig?.IN_APP_REVIEW_REQUIRED_RATING){
      console.log("Triggering In App Review on 5 star")
       triggerInAppReview();
      }
    
      await DataStore.clearData(PREF.CURRENT_TRIP)
      setActiveTripId(null);
      reset()
     
      
    }else{
        firebaselog_tripReview('Trip_Review_TR','TR_R:failed_customer')
      showNotification(t('error'),t('something_went_wrong'),"error")
    }
  }catch(e){
    console.log("Error submitting feedback",e)
  }finally{
    setIsSubmitting(false);
  }
  }



  const handleClose = () => {
      firebaselog_tripReview('Trip_Review_TR','TR_R:skip_customer')
    // Animated.parallel([
    //   Animated.timing(bounceValue, {
    //     toValue: height,
    //     duration: 250,
    //     useNativeDriver: true,
    //   }),
    //   Animated.timing(overlayOpacity, {
    //     toValue: 0,
    //     duration: 250,
    //     useNativeDriver: true,
    //   }),
    // ]).start(() => {
    //   if (OnClose) OnClose();
    // });
    if(OnClose) OnClose()
  };



  if(isLoading || !minDelayDone){
    return (
      <View style={styles.loaderContainer}>
        <LottieView
          source={require('../../../assets/lottie/completed.json')}
          autoPlay
          loop
          style={{ width: width, height: height/2 }}
        />
      </View>
    )
  }

  return (
    <View style={[styles.wrapper, { zIndex: 999999 }]}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomSheetWrapper,
          {
            transform: [{ translateY: bounceValue }],
          },
        ]}
      >
       

        <View style={styles.bottomSheet}>
          <View style={styles.contentContainer}>
          <View style={styles.header}>
          <RideStatusHeader 
            title={t('your_ride_is_completed')}
          />
          {tripStatus === 'DIVERGED' && (
            <AdaptiveText style={{color: '#E57373', fontSize: 14, marginTop: 4, textAlign: 'center',fontFamily:Fonts.regular}}>
              {t('trip_stopped_midway')}
            </AdaptiveText>
          )}
        </View>

        {/* <View style={styles.dottedLine}></View> */}
        {/* <View style={styles.Rideisnfo}>   
            <AdaptiveText style={styles.RideFareText}>
            ₹ {tripFare}
            </AdaptiveText>
            <View style={[styles.RideInfoContainer,]}>
                <View style={[styles.seprator]}/>

              
                <View style={styles.RideInfoContainerBox}>
                    <AdaptiveText style={styles.RideInfoText}>
                        {typeof tripDistance === 'number' ? tripDistance.toFixed(1) : '0'} Km  .  {utils.formatMinutesToReadable(tripDuration)}
                    </AdaptiveText>

                </View>
                   <View style={[styles.seprator]}/>

               
            </View>
        </View> */}
        {appConfig?.SHOW_SOCIAL_BANNER && 
          <Social/>
        }
          <View >
            {/* <TripPersonVehicle driverName={driverDetails?.driverName} driverPhoto={driverDetails?.driverPhoto} vehicleType={driverDetails?.vehicleType} vehicleBrand={driverDetails?.vehicleBrand} vehicleModel={driverDetails?.vehicleModel} vehicleNumber={driverDetails?.vehicleNumber} layoutStyle={"row"} descriptonSize={12}/> */}
            </View>
           <RatingBox onRatingSubmit={handleSubmit} isSubmitting={isSubmitting}/>
           <TouchableOpacity onPress={handleClose}>
          <AdaptiveText style={styles.LATERText}>
            {t('later')}
          </AdaptiveText>
        </TouchableOpacity>
          </View>
          
        </View>
       
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 9998,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)', // 75% opacity as requested
    zIndex: 9999,
  },
  bottomSheetWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10000,
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  
  },
  closeButtonContainer: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contentContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black_primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  feedbackContent: {
    flex: 1,
  },
  ratingSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black_primary,
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  starButton: {
    padding: 5,
  },
  categoriesSection: {
    marginBottom: 30,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryText: {
    fontSize: 14,
    color: colors.black_primary,
  },
  commentsSection: {
    marginBottom: 30,
  },
  commentBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    color: colors.white,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  dottedLine: {
    height: 1,
   
    marginBottom: 16,
    marginHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#bdbdbd',
    borderStyle: 'dashed',
  },
  RideInfoContainer:{
    flexDirection:'row',
    
    alignItems:'center',
    justifyContent:'center',
    marginTop:10
  
   
  },
  seprator:{
    height:1,
    flex:1,
    backgroundColor:"#bdbdbd",
  },
  RideInfoContainerBox:{
    padding:10,
    paddingHorizontal:20,
  
    borderRadius:30,
    borderWidth:1,
    borderColor:"#bdbdbd",

  },
  RideFareText:{
    fontSize:30,
    fontFamily:Fonts.medium,
    color:colors.black_primary,
    textAlign:"center"
  },
  RideInfoText:{
    fontSize:16,
    fontFamily:Fonts.regular,
    color:colors.black_primary, 
    textAlign:"center"
  },
  LATERText:{
    fontSize:14,
    fontFamily:Fonts.regular,
    color:colors.black_primary,
    textAlign:"center",
    marginTop:20
  },
  loaderContainer:{
    flex:1,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#fff'
  }
  
});

TripFeedbackScreen.propTypes = {
  onClose: PropTypes.func,
  zIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]),
};

TripFeedbackScreen.defaultProps = {
  onClose: null,
  zIndex: false,
};
