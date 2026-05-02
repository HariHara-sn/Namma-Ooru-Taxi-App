import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import React, { useState } from 'react';
import { approveBill } from '../API/EndPoints/EndPoints';
import {vehicleDetailsStyles} from '../styles/VehicleDetails';
import useLocationStore from '../store/useLocationStore';
import DistanceBlue from '../assets/image/svgIcons/distanceBlue.svg';
import Watch from '../assets/image/svgIcons/watch.svg';
import Fare from '../assets/image/svgIcons/fare.svg';
import Support from '../assets/image/svgIcons/support.svg';
import {rideStyles} from '../styles/RideStyles';
import {rideSummary} from '../styles/RideSummary';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors, Fonts} from '../constants/constants';
import {Rating} from 'react-native-ratings';
import AddressContainer from '../components/Trips/AddressContainer';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Image } from 'react-native';
import useRideSelectionStore from '../store/useRideSelectionStore';
import {useStackScreenStore} from '../store/useStackScreenStore';
import useMapStore from '../features/map/store/useMapStore';
import useMapStyleStore from '../store/useMapStyleStore';
import locationTask from '../controllers/GetCurrentLocation';
import DriverProfileImage from '../assets/image/driver.png';
import useCurrentRideInfoStore from '../features/rideStatus/store/useCurrentRideInfoStore';

const RideSummary = () => {
  const {directions, setDirections} = useLocationStore();
  const {assignedDriver, bookingDetails, rideDistance, setBookingDetails, setAssignedDriver, setRideStatus} = useRideSelectionStore();
  const {reset: resetStackScreen} = useStackScreenStore();
  const {setOnSearchResults, setMapMarkers, setDirectionPoints, setSearchUnit} = useMapStore();
  const {resetMapStyle} = useMapStyleStore();
  const { bills: rideInfoBills, tripId: rideInfoTripId } = useCurrentRideInfoStore();

  const isCompleted = false;

  // Per-bill loading state for approve/reject actions
  const [billLoadingIdx, setBillLoadingIdx] = useState(null);
  const [billApprovals, setBillApprovals] = useState({});

  // Use bills from bookingDetails if available, fall back to currentRideInfoStore
  const driverBills = (bookingDetails?.bills?.bills ?? rideInfoBills?.bills) || [];

  const handleBillApproval = async (idx, approval) => {
    const tripId = bookingDetails?._id || rideInfoTripId;
    if (!tripId) return;
    setBillLoadingIdx(idx);
    try {
      const res = await approveBill(String(tripId), idx, approval);
      if (res?.success) {
        setBillApprovals(prev => ({ ...prev, [idx]: approval }));
      } else {
        Alert.alert('Error', res?.message || 'Could not update bill approval.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setBillLoadingIdx(null);
    }
  };

  const handleGoToHome = async () => {
    // Reset all ride-related data
    setBookingDetails(null);
    setAssignedDriver(null);
    setRideStatus(null);
    
    // Reset location data
    setDirections([
      { id: 1, name: 'Start', location: [], locationName: '' },
      { id: 2, name: 'End', location: [], locationName: '' },
    ]);
    
    // Reset map data
    setOnSearchResults(null);
    setMapMarkers([]);
    setDirectionPoints(null);
    setSearchUnit('');
    
    // Reset map style
    resetMapStyle();
    
    // Reset navigation stack to home
    resetStackScreen();
    
    // Get current location
    await locationTask.getCurrentLocation();
  };

  return (
    <View style={{flex:1, backgroundColor:colors.white,paddingVertical:20}}>
      <Text style={{fontFamily:Fonts.regular,fontSize:20, color:colors.black,textAlign:'center',paddingVertical:10}}>You have reached your destination</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={rideSummary.priceContainer}>
          <ImageBackground
            source={require('../assets/image/summaryBg.png')}
            style={rideSummary.imageBg}
            resizeMode="cover">
            <Text style={rideSummary.rideFare}>Ride Fare</Text>
            <Text style={rideSummary.rideFareAmount}>₹{bookingDetails?.estimatedFare}</Text>
          </ImageBackground>
        </View>
        <Text style={rideSummary.headerDate}>Mon, Jan 01 2022 | 3:00 PM</Text>
        <Text style={rideSummary.headerTipId}>Trip ID : ABCD01234</Text>
        <View style={rideSummary.seperater} />
        <Text style={rideSummary.titles}>Location Details</Text>
        <AddressContainer directions={directions} />
        <View style={rideSummary.seperater} />
        <Text style={rideSummary.titles}>Trip Details</Text>
        <View style={[rideStyles.driverDetailsB, {marginTop: 15}]}>
        <View style={rideStyles.driverDetails}>
            <View style={rideStyles.profileContainer}>
              <Image
                source={DriverProfileImage}
                style={rideStyles.profileImage}
              />
              <View style={rideStyles.rating}>
                <AntDesign name="star" color={colors.yellow} size={10} />
                <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: colors.black, marginLeft: 2 }}>4.8</Text>
              </View>
            </View>

            <View style={rideStyles.profileNameContainer}>
              <Text style={rideStyles.driverName}>{assignedDriver?.name} . {assignedDriver?.ownVehicleInfo?.vehicleNumber}</Text>
              <Text style={rideStyles.driverratingTxt}>{assignedDriver?.ownVehicleInfo?.vehicleBrand} . {assignedDriver?.ownVehicleInfo?.vehicleModel} . {assignedDriver?.ownVehicleInfo?.vehicleColor}</Text>
            </View>

           
          </View>
        </View>
        <View style={rideSummary.rideDetails}>
          <View
            style={[rideSummary.rideDetailsCards, {backgroundColor: '#e5f6ff'}]}>
            <DistanceBlue />
            <Text style={rideSummary.rideDetailsCardsText}>Distance</Text>
            <Text style={rideSummary.rideDetailsText}>{rideDistance?.toFixed(1)} km</Text>
          </View>
          <View
            style={[rideSummary.rideDetailsCards, {backgroundColor: '#fef4e4'}]}>
            <Watch />
            <Text style={rideSummary.rideDetailsCardsText}>Duration</Text>
            <Text style={rideSummary.rideDetailsText}>{Math.round(bookingDetails?.estimatedDuration/60)} mins</Text>
          </View>
          <View
            style={[rideSummary.rideDetailsCards, {backgroundColor: '#e9f4ef'}]}>
            <Fare />
            <Text style={rideSummary.rideDetailsCardsText}>Fare</Text>
            <Text style={rideSummary.rideDetailsText}>₹{bookingDetails?.estimatedFare}</Text>
          </View>
        </View>

        <View style={rideSummary.seperater} />

        <View style={rideSummary.billView}>
          <Text style={rideSummary.titles}>Payment Details</Text>
          <View style={rideSummary.billContents}>
            <Text style={rideSummary.billTitle}>Trip Bill</Text>
            <Text style={rideSummary.billPrice}>₹{bookingDetails?.estimatedFare}</Text>
          </View>
          <View style={rideSummary.billContents}>
            <Text style={rideSummary.billTitle}>GST 0%</Text>
            <Text style={rideSummary.billPrice}>₹0.00</Text>
          </View>
          <View style={rideSummary.billContents}>
            <Text style={rideSummary.billTitle}>Booking Charges</Text>
            <Text style={rideSummary.billPrice}>-₹0.00</Text>
          </View>
          <View style={rideSummary.seperater} />
          <View style={rideSummary.billContents}>
            <Text style={rideSummary.billTitleTotal}>Total Bill</Text>
            <Text style={rideSummary.billPriceTotal}>₹{bookingDetails?.estimatedFare}</Text>
          </View>
        </View>

        {isCompleted && (
          <TouchableOpacity style={vehicleDetailsStyles.paymentContainer}>
            <Text style={vehicleDetailsStyles.paymentTxt}>Payment Method</Text>
            <Text>Cash</Text>
          </TouchableOpacity>
        )}

        {isCompleted && (
          <View>
            <View style={rideSummary.seperater} />
            <Text style={rideSummary.titles}>How is your Trips?</Text>
            <View
              style={[rideStyles.driverDetailsB, {marginTop: 15, width: '96%'}]}>
              <View style={rideStyles.profilePic}></View>
              <Rating
                type="custom"
                ratingCount={5}
                imageSize={30}
                onFinishRating={e => console.log('star-->>rating-->>', e)}
                style={{paddingVertical: 10}}
                defaultRating={3.5}
              />
              <TextInput style={rideSummary.input} placeholder="Comments" />
            </View>

            <TouchableOpacity style={rideSummary.submitBtn}>
              <Ionicons name={'checkmark'} size={22} color={colors.white} />
              <Text style={rideSummary.submitBtnTxt}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={vehicleDetailsStyles.paymentContainer}>
          <Text style={vehicleDetailsStyles.paymentTxt}>
            Get Help from Support
          </Text>
          <Support />
        </TouchableOpacity>

        {/* ── Driver submitted bills ── */}
        {driverBills.length > 0 && (
          <View style={billStyles.section}>
            <Text style={billStyles.sectionTitle}>Driver Bills / Expenses</Text>
            {driverBills.map((bill, idx) => {
              const effective = billApprovals[idx] || bill.approval || 'pending';
              const isLoading = billLoadingIdx === idx;
              return (
                <View key={idx} style={billStyles.card}>
                  <View style={billStyles.cardTop}>
                    <Text style={billStyles.desc}>{bill.description || 'Expense'}</Text>
                    <Text style={billStyles.amount}>₹{parseFloat(bill.amount || 0).toFixed(2)}</Text>
                  </View>
                  {effective !== 'pending' ? (
                    <View style={[billStyles.badge,
                      effective === 'approved' ? billStyles.badgeApproved : billStyles.badgeRejected]}>
                      <Ionicons
                        name={effective === 'approved' ? 'checkmark-circle' : 'close-circle'}
                        size={13}
                        color={effective === 'approved' ? '#43A047' : '#E53935'}
                      />
                      <Text style={[billStyles.badgeTxt,
                        effective === 'approved' ? billStyles.badgeTxtApproved : billStyles.badgeTxtRejected]}>
                        {effective === 'approved' ? 'You Approved' : 'You Rejected'}
                      </Text>
                    </View>
                  ) : (
                    <View style={billStyles.actions}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color={colors.primary || '#5C6BC0'} />
                      ) : (
                        <>
                          <TouchableOpacity
                            style={[billStyles.actionBtn, billStyles.approveBtn]}
                            onPress={() => handleBillApproval(idx, 'approved')}
                            activeOpacity={0.8}>
                            <Ionicons name="checkmark" size={14} color="#fff" />
                            <Text style={billStyles.actionTxt}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[billStyles.actionBtn, billStyles.rejectBtn]}
                            onPress={() => handleBillApproval(idx, 'rejected')}
                            activeOpacity={0.8}>
                            <Ionicons name="close" size={14} color="#fff" />
                            <Text style={billStyles.actionTxt}>Reject</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      
      {isCompleted ? (
        <TouchableOpacity
          style={[rideSummary.payBtn, {backgroundColor: colors.black}]}
          onPress={handleGoToHome}>
          <Text style={rideSummary.payBtnTxt}>HOME</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={rideSummary.payBtn}
          onPress={handleGoToHome}>
          <Text style={rideSummary.payBtnTxt}>PAY ₹{bookingDetails?.estimatedFare}</Text>
        </TouchableOpacity>
      )}
   </View>
  );
};

export default RideSummary;

const billStyles = StyleSheet.create({
  section: { marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontFamily: Fonts.semi_bold || Fonts.medium, color: '#212121', marginBottom: 10 },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  desc: { fontSize: 13, fontFamily: Fonts.medium, color: '#212121', flex: 1 },
  amount: { fontSize: 14, fontFamily: Fonts.semi_bold || Fonts.medium, color: '#212121' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8 },
  approveBtn: { backgroundColor: '#43A047' },
  rejectBtn:  { backgroundColor: '#E53935' },
  actionTxt: { fontSize: 13, fontFamily: Fonts.medium, color: '#fff' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeApproved: { backgroundColor: '#E8F5E9' },
  badgeRejected: { backgroundColor: '#FFEBEE' },
  badgeTxt: { fontSize: 12, fontFamily: Fonts.medium },
  badgeTxtApproved: { color: '#43A047' },
  badgeTxtRejected: { color: '#E53935' },
});

