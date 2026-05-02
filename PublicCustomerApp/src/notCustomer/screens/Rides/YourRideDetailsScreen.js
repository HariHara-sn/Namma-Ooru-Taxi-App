import { ScrollView, Text, Image, TextInput, TouchableOpacity, View, ActivityIndicator, FlatList } from 'react-native';
import React, { useRef, useState, useCallback, useEffect } from 'react';

import CountryPicker, { FlagButton } from 'react-native-country-picker-modal';
import BackArrow from '../../assets/image/backArrow.svg';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { showNotification } from '../../components/NotificationManger';
import { DataStore } from '../../controllers/DataStore';
import { useGetQuery } from '../../hooks/useQuery';
import useUserInfoStore from '../../../common/store/useUserInfoStore';
import { utils } from '../../utils/Utils';
import { Rating } from 'react-native-ratings';

import { TripSummaryStyle } from '../../styles/Trips/TripSummary';

// images
import DistanceImage from '../../assets/image/Trips/Summary/Distance.webp'
import DurationImage from '../../assets/image/Trips/Summary/Duration.webp'
import RideTypeImage from '../../assets/image/Trips/Summary/RideType.webp'
import ProfileImage from '../../assets/image/account/Profile.webp';
import PaymentMode from '../../assets/image/Trips/Summary/PaymentMode.svg';

import NavBar from '../../components/NavBar';
import TripSummaryWaypoints from '../../components/Trips/TripSummaryWaypoints';
import MapContainer from '../../features/map/components/MapContainer';

const YourRideDetailsScreen = ({ TripData }) => {

    // const rideDetails = route.params.ride
    console.log(TripData,"TripData");

    const RideDetails = {
        bookedTime: 1726120926843,
        trip_id: 123,
        fare: '100.00',
        distance: 10,
        duration: 20,
        trip_type: 'pickup',
        driver_profile: '',
        driver_name: 'Vandervort Wilmer'
    }

    const [RideRating, setRideRating] = useState(0);
    const [RideComment, setRideComment] = useState('');

    const navigation = useNavigation();

    const HandleBackBtn = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'HomeScreen' }],
            }),
        );
    }

    const HandeUpdateRide = async () => { }

    return (
        <ScrollView style={TripSummaryStyle.container}>
            <View style={{
                position: 'absolute',
                top: 10,
                width: "100%",
                backgroundColor: "white"
            }}>
                <NavBar withBg onBackPress={HandleBackBtn} title={'Trip Details'} />
            </View>

            <View style={TripSummaryStyle.mapContainer}>
                <MapContainer
                    mapStyle={TripSummaryStyle.map}
                />
            </View>
            <View style={TripSummaryStyle.containerContent}>
                <View style={TripSummaryStyle.fareCard}>
                    <Text style={TripSummaryStyle.fareCardLable}>Ride Fare</Text>
                    <View style={TripSummaryStyle.fareCardValueMain}>
                        <Text style={TripSummaryStyle.fareCardValue}>₹{RideDetails.fare}</Text>
                    </View>
                </View>
                <View style={TripSummaryStyle.header}>
                    <Text style={TripSummaryStyle.date}>{utils.formatDateAndTime(RideDetails.bookedTime)}</Text>
                    <Text style={TripSummaryStyle.tripId}>Trip ID : {RideDetails.trip_id}</Text>
                </View>
                <View style={[TripSummaryStyle.header, { marginTop: 20 }]}>
                    <Text style={TripSummaryStyle.date}>Location Details</Text>
                </View>
                <View style={TripSummaryStyle.locationDetails}>
                    <TripSummaryWaypoints />
                </View>
                <View style={TripSummaryStyle.header}>
                    <View style={TripSummaryStyle.headerTextContainer}>
                        <Text style={TripSummaryStyle.headerText}>Trip Details</Text>
                    </View>
                    <View style={{ ...TripSummaryStyle.dashedLine, width: 80 }} />
                </View>
                <ScrollView
                    contentContainerStyle={TripSummaryStyle.tripDetails}
                    horizontal
                    showsHorizontalScrollIndicator={true}
                >
                    {/* Distance */}
                    <View style={TripSummaryStyle.detailRow}>
                        <Image source={DistanceImage} style={TripSummaryStyle.tripDetailIcon} />
                        <Text style={TripSummaryStyle.detailLabel}>Distance</Text>
                        <Text style={TripSummaryStyle.detailValue}>{RideDetails.distance} km</Text>
                    </View>

                    {/* Duration */}
                    <View style={[TripSummaryStyle.detailRow, { backgroundColor: 'rgba(255, 153, 0, 0.1)' }]}>
                        <Image source={DurationImage} style={TripSummaryStyle.tripDetailIcon} />
                        <Text style={TripSummaryStyle.detailLabel}>Duration</Text>
                        <Text style={TripSummaryStyle.detailValue}>{RideDetails.duration} min</Text>
                    </View>

                    {/* Fare */}
                    <View style={[TripSummaryStyle.detailRow, { backgroundColor: 'rgba(41, 152, 101, 0.1)' }]}>
                        <Image source={RideTypeImage} style={TripSummaryStyle.tripDetailIcon} />

                        <Text style={TripSummaryStyle.detailLabel}>Fare</Text>
                        <Text style={TripSummaryStyle.detailValue}>₹{RideDetails.fare}</Text>
                    </View>
                    {/* Ride Type */}
                    <View style={[TripSummaryStyle.detailRow, { backgroundColor: 'rgba(108, 41, 152, 0.1)' }]}>
                        <Image source={RideTypeImage} style={TripSummaryStyle.tripDetailIcon} />

                        <Text style={TripSummaryStyle.detailLabel}>Ride Type</Text>
                        <Text style={TripSummaryStyle.detailValue}>{utils.toTitleCase(RideDetails.trip_type)}</Text>
                    </View>
                </ScrollView>
                <View style={TripSummaryStyle.paymentDetailsContainer}>
                    <View style={TripSummaryStyle.paymentDetailsHeader}>
                        <Text style={TripSummaryStyle.paymentDetailsHeaderText}>Payment Details</Text>
                    </View>
                    <View style={TripSummaryStyle.paymentDetailsItems}>
                        <View style={TripSummaryStyle.paymentDetailsItem}>
                            <Text style={TripSummaryStyle.paymentDetailsItemLabel}>Trip Bill</Text>
                            <Text style={TripSummaryStyle.paymentDetailsItemValue}>₹92.00</Text>
                        </View>
                        <View style={TripSummaryStyle.paymentDetailsItem}>
                            <Text style={TripSummaryStyle.paymentDetailsItemLabel}>GST 18%</Text>
                            <Text style={TripSummaryStyle.paymentDetailsItemValue}>₹18.00</Text>
                        </View>
                        <View style={TripSummaryStyle.paymentDetailsItem}>
                            <Text style={TripSummaryStyle.paymentDetailsItemTotalLabel}>Total Bill</Text>
                            <Text style={TripSummaryStyle.paymentDetailsItemTotalValue}>₹100.00</Text>
                        </View>
                    </View>
                </View>
                <View style={TripSummaryStyle.paymentModeContainer}>
                    <View style={TripSummaryStyle.paymentModeLabelMain}>
                        <PaymentMode />
                        <Text style={TripSummaryStyle.paymentModeLabel}>Payment Method</Text>
                    </View>
                    <TouchableOpacity
                        style={TripSummaryStyle.paymentModeValueMain}
                    >
                        <Text style={TripSummaryStyle.paymentModeValue}>Cash</Text>
                    </TouchableOpacity>
                </View>
                <View style={TripSummaryStyle.header}>
                    <View style={TripSummaryStyle.headerTextContainer}>
                        <Text style={TripSummaryStyle.headerText}>How is your Trips?</Text>
                        <View style={{ ...TripSummaryStyle.dashedLine, width: 80 }} />
                        <Text style={TripSummaryStyle.headerDesc}>Your feedback will help us improving driving experience better</Text>
                    </View>
                </View>
                <View style={TripSummaryStyle.profile}>
                    <Image
                        source={RideDetails.driver_profile ? { uri: RideDetails.driver_profile } : ProfileImage}
                        style={TripSummaryStyle.profilePic} />
                    <Text
                        style={TripSummaryStyle.profileLabel}>{RideDetails.driver_name}</Text>
                </View>
                <View style={TripSummaryStyle.ratingContainer}>
                    <Rating
                        type="star"
                        ratingCount={5}
                        imageSize={30}
                        onFinishRating={(rating) => setRideRating(rating)}
                    />
                    <TextInput
                        value={RideComment}
                        style={TripSummaryStyle.textArea}
                        underlineColorAndroid="transparent"
                        placeholder="Comments"
                        placeholderTextColor="grey"
                        numberOfLines={10}
                        multiline={true}
                        onChangeText={(value) => setRideComment(value)}
                    />
                    <TouchableOpacity
                        style={TripSummaryStyle.submitButton}
                        onPress={() => HandeUpdateRide()}
                    >
                        <Text style={TripSummaryStyle.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    )
}

export default YourRideDetailsScreen;