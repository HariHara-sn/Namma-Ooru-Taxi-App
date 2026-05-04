import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import useTripsStore from '../store/useTripsStore';
import { useMapMarkerStore } from '../../common/store/useMapMarkerStore';
import { useTripAcceptStore } from '../store/useTripAcceptStore';
import useUserStore from '../../common/store/useUserStore';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import APIRequest from '../../common/APIRequest';
import { showNotification } from '../../common/components/Alerts/showNotification';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import { DateTimeFormatter } from '../../common/utils/DateTimeFormatter';
import AddressComponent from '../components/AddressComponent';
import BottomSheet from '../../common/components/BottomSheet';
import TotalDistance from '../../notdriver/assets/icons/totalDistance.svg'
import TotalEarnings from '../../notdriver/assets/icons/totalEarnings.svg'
import TotalHours from '../../notdriver/assets/icons/totalHours.svg'
import PushNotifications from '../../common/core/PushNotifications';
import { useTranslation } from 'react-i18next';
import { firebaselog_onRide } from '../../common/utils/FirebaseAnalytics';
import { height } from '../../common/utils/scalingutils';

const StopChangeRequest = () => {
    const {newStopData, setNewStopData, updateNewStopData} = useTripsStore();
    const {setDirectionPoints, setDirectionResponse} = useMapMarkerStore();
    const {loading} = useTripAcceptStore();
    const {activeTripData, setActiveTripData} = useTripsStore();
    const {userInfo} = useUserStore()
    const {setStackScreen} = useStackScreenStore()
    const {t} = useTranslation()
    const [isLoading, setIsLoading] = useState()

      const onAcceptPress = async () => {
        setIsLoading(true)
          try {
            const api = new APIRequest();
            const url = `/publicrides/driver/v2/acceptPassengerStopChangeRequest`;
            const payload = {
              tripId: activeTripData[0]?._id,
              action: 'accept'
            };
            const res = await api.request(
              url,
              'POST',
              payload,
              userInfo?.token,
            );
            if (res.success) {
                updateNewStopData(newStopData)
                setNewStopData(null)
                setDirectionResponse(null)
                showNotification('Stops Updated Successfully', '' , 'success')
                PushNotifications.onClearAllNotifications();
                firebaselog_onRide('OR_Edit(OR_E)', 'OR_E:driver_accept_edit')
                setStackScreen('PublicDriverTrackingScreen')
            } else {
                showNotification(res?.message, '' , 'danger')
            }
            setIsLoading(false)
          }catch (e) {
            // console.log('hari-->>error-->>accept-->>', e)
            showNotification('Something Went Wrong', '', 'danger')
            setIsLoading(false)
          }
      }

      const onRejectPress = async () => {
        setIsLoading(true)
        try {
            const api = new APIRequest();
            const url = `/publicrides/driver/v2/acceptPassengerStopChangeRequest`;
            const payload = {
              tripId: activeTripData[0]?._id,
              action: 'reject'
            };
            const res = await api.request(
              url,
              'POST',
              payload,
              userInfo?.token,
            );
            if (res.success) {
                setNewStopData(null)
                setDirectionResponse(null)
                showNotification('Stops Updated Successfully', '' , 'success')
                PushNotifications.onClearAllNotifications();
                firebaselog_onRide('OR_Edit(OR_E)', 'OR_E:driver_reject_edit')
                setStackScreen('PublicDriverTrackingScreen')
            }else {
                showNotification(res?.message, '' , 'danger')
            }
            setIsLoading(false)
        } catch (e) {
            // console.log('hari-->>error-->>reject-->>', e)
            showNotification('Something Went Wrong', '', 'danger')
            setIsLoading(false)
        }
      }

      useEffect(()=> {
        if (newStopData?.routeData) {
          const request = newStopData?.routeData?.request
          const response = newStopData?.routeData?.response
          const padding = [50, 50, 50, height*0.5]
          const routeID = 1
          setDirectionResponse([{requests:request, response:response,padding: padding.map(v => parseInt(v, 10)), routeID: routeID}]);
          return
        }
        if (newStopData?.stops && newStopData?.stops.length !== 0) {
          const directions = newStopData?.stops?.map((direction)=>{
            return {
              lat: direction.location[1],
              lon: direction.location[0],
            }
          })
          setDirectionPoints({
            locations: directions,
            type: 'car',
          });
        }
      },[newStopData])
      
  return (
    <>
     <View style={{flex:1}}>
     <BottomSheet>
     {loading || isLoading && <FullScreenLoader />}
     <View style={styles.BtnContainer}>
        <TouchableOpacity style={[styles.actinBtns,{backgroundColor:Colors.black}]} onPress={()=>onRejectPress()}>
            <Text style={[styles.actinBtnsTxt,{}]}>{t('reject') || 'Reject'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actinBtns,{backgroundColor:Colors.periwinkle}]} onPress={()=>onAcceptPress()}>
            <Text style={[styles.actinBtnsTxt,{}]}>{t('accept')}</Text>
        </TouchableOpacity>
        </View>
     <View style={styles.tripDetailsViewContainer}>
       <View style={[styles.tripDetailsItem]}>
       <TotalDistance/>
          <Text style={styles.tripDetailsItemText}>{(newStopData?.distance)} Km</Text>
        </View>
        <View style={styles.tripDetailsItem}>
        <TotalHours/>
          <Text style={styles.tripDetailsItemText}>{DateTimeFormatter.formatMinutesToDuration(newStopData?.duration)}</Text>
        </View>
        <View style={[styles.tripDetailsItem]}>
        <TotalEarnings/>
          <Text style={styles.tripDetailsItemText}>₹ {newStopData?.fare}</Text>
        </View>
        </View>
        <AddressComponent
              percentage={0}
              waypoints={newStopData?.stops}
              deviceLocation={null}
              isPublicRides={true}
            />
         </BottomSheet>
     </View>
     
    </>
     
  )
}

export default StopChangeRequest

const styles= StyleSheet.create({
    BtnContainer:{
        width:'90%',
        alignSelf:'center',
        flexDirection:'row',
        justifyContent:'space-evenly'
    },
    actinBtns:{
        width:'40%',
        paddingVertical:10,
        paddingHorizontal:10,
        alignItems:'center',
        backgroundColor:'red',
        borderRadius:8,
        elevation:1,
        marginVertical:20
    },
    actinBtnsTxt:{
        fontFamily:Fonts.medium,
        fontSize:16,
        color:Colors.white,
    },
    tripDetailsViewContainer:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-between',
        gap:20,
        width:'80%',
        alignSelf:'center',
        borderStyle:'dashed',
        borderColor:Colors.grey_xxdark, 
        paddingVertical:10,
        backgroundColor:'#FAFAFA',
        paddingHorizontal:10,
        borderRadius:10,
        elevation:1,
        marginBottom:10
      },
      tripDetailsItem:{
        alignItems:'center',
        gap:5,
        flexDirection:'row'
      },
      tripDetailsItemText:{
        fontFamily:Fonts.regular,
        fontSize:12,
        color:Colors.black
      },
      tripDetailsItemTextTitle:{
        fontFamily:Fonts.regular,
        fontSize:12
      },
})


