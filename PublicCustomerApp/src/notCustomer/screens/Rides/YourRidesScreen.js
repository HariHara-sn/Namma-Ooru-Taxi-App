import { Dimensions, ScrollView, Text, Image, TextInput, TouchableOpacity, View, ActivityIndicator, FlatList } from 'react-native';
import React, { useRef, useState, useCallback, useEffect } from 'react';
const { width: windowWidth } = Dimensions.get('window');

import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview';
import { yourRidesStyles } from '../../styles/YourRidesStyles';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { showNotification } from '../../components/NotificationManger';
import { useGetQuery } from '../../hooks/useQuery';
import useUserInfoStore from '../../../common/store/useUserInfoStore';
import { utils } from '../../utils/Utils';

import NavBar from '../../components/NavBar';
import ToggleHeader from '../../components/ToggleHeader';
import DurationFilter from '../../components/DurationFilter';

import NoTripsFound from '../../components/NoTripsFound';

import ProfileImage from '../../assets/image/account/Profile.webp';

const YourRidesScreen = () => {
    const navigation = useNavigation();

    const { userdetails, setUserdetails } = useUserInfoStore();

    const [UserId, setUserId] = useState('');


    const [Rides, setRides] = useState([
        {
            bookingTime: 1726120926843,
            _id: 123,
            fare: 100,
            distance: 10,
            duration: 20,
            trip_type: 'pickup',
            driver_profile: '',
            driver_name: 'John Doe',
            vehicleType: 'bike',
            startLocation: {
                address: 'Kolkata'
            },

            endLocation: {
                address: 'Kolkata'
            },
            
        },
    ]);



    const [FilterTripType, setFilterTripType] = useState('');
    const [FilterStart, setFilterStart] = useState('');
    const [FilterEnd, setFilterEnd] = useState('');
    const [FilterPage, setFilterPage] = useState(1);
    const [FilterLimit, setFilterLimit] = useState(10);
    const [FilterMaxPages, setFilterMaxPages] = useState(FilterLimit);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadMore, setIsLoadMore] = useState(false);

    const [Header_Options, setHeader_Options] = useState([
        {
            id: 'completed',
            title: 'Trip History',
        },
        {
            id: 'upcoming',
            title: 'Upcoming Rides',
        }
    ])
    const HandleBackBtn = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'HomeScreen' }],
            }),
        );
    }

    const onGetRidesSuccess = async (data) => {
        
        setIsRefreshing(false);
        if (data.success) {

            let { trips, pagination } = data
            if (isLoadMore) setRides([...Rides])
            else setRides(trips)

            setFilterMaxPages(pagination?.totalPages)

        } else {
            showNotification('Failed to get rides', data.message, 'danger');
        }

        setIsLoadMore(false);
    }

    const onGetRidesError = (data) => {
        setIsRefreshing(false);
        if (!data.success) showNotification('Failed to get rides', data.message, 'danger');

    }

    const { mutate: GetRidesMutate, isSuccess } = useGetQuery({
        onSuccess: onGetRidesSuccess,
        onError: onGetRidesError
    });

    const LoadRides = async () => {
        console.log('LoadRides');

        let payload = {
            status: FilterTripType || 'COMPLETED',
        }
        const today = new Date();
        const startOfDay = today.setHours(0, 0, 0, 0);
        const endOfDay = today.setHours(23, 59, 59, 999);
        payload.startTime = startOfDay;
        payload.endTime = endOfDay;

        setIsRefreshing(true);
        await GetRidesMutate({
            queryKey: 'GetRidesQuery',
            url: '/publicrides/customer/v2/getTrips',
            query: payload
        })

    }

    const ToggleHeaderCallback = (id) => {
        setFilterTripType(id);
    }

    const DurationFilterCallback = (id, start, end) => {
        setFilterStart(start);
        setFilterEnd(end);
    }

    const HandleRideOpen = (ride) => {
        navigation.dispatch(
            CommonActions.navigate({
                name: 'YourRideDetailsScreen',
                params: { ride: ride }
            }),
        );
    }

    const RenderTrip = ({ ride, index }) => {

        return (
            <TouchableOpacity
                key={`your-ride-${index}`}
                style={yourRidesStyles.ridesContainerItem}
                onPress={() => HandleRideOpen(ride)}
            >
                <View
                    style={yourRidesStyles.ridesContainerItemLeft}
                >
                    <Text style={yourRidesStyles.ridesContainerItemTitle}>{utils.formateDateLabel(ride.bookingTime)}</Text>
                    <Text style={yourRidesStyles.ridesContainerItemDesc}>{ride?.endLocation?.address || '--'}</Text>
                    <Text style={yourRidesStyles.ridesContainerItemFare}>₹{ride.fare || '00'}</Text>
                </View>
                <View
                    style={yourRidesStyles.ridesContainerItemRight}
                >
                    <View
                        style={yourRidesStyles.ridesContainerItemImgs}
                    >
                        <Image
                            source={utils.getVehicleTypeImage(ride.vehicleType)}
                            style={yourRidesStyles.ridesContainerItemVehicleImg}
                        />
                        <Image
                            source={ride.driver_profile || ProfileImage}
                            style={yourRidesStyles.ridesContainerItemDriverImg}
                        />
                    </View>
                    <View style={yourRidesStyles.ridesContainerItemRight}>
                        <Text style={[{ textAlign: 'right' }, yourRidesStyles.ridesContainerItemTitle]}>{ride.driver_name || '-'}</Text>
                        <Text style={[{ textAlign: 'right' }, yourRidesStyles.ridesContainerItemDesc]}>{utils.getVehicleTypeLabel(ride.vehicleType)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    const HandleRefresh = () => {
        setFilterPage(1);
        LoadRides();
    }
    const HandleLoadMore = () => {
        if (isRefreshing || FilterMaxPages < FilterPage) return;
        setIsLoadMore(true);
        setFilterPage(FilterPage + 1);
        LoadRides();
    }

    const dataProvider = React.useMemo(() => {
        return new DataProvider((r1, r2) => r1 !== r2).cloneWithRows(Rides);
    }, [Rides]);
    const layoutProvider = React.useMemo(() => {
        return new LayoutProvider(
            index => 1,
            (type, dim) => {
                dim.width = windowWidth;
                dim.height = 180;
            }
        );
    }, []);

    const rowRenderer = React.useCallback((type, data, index) => {
        return <RenderTrip ride={data} index={index} />
    }, []);

    const renderFooter = React.useMemo(() => {
        if (!isRefreshing) return null;
        return <ActivityIndicator size="large" color="#0000ff" />;
    }, [isRefreshing]);

    useEffect(() => {
        LoadRides();
    }, [])

    useEffect(() => {
        if (FilterTripType || (FilterStart && FilterEnd)) {
            LoadRides();
        }

    }, [FilterTripType, FilterStart, FilterEnd])

    return (
        <View style={yourRidesStyles.mainContainer}>
            <NavBar withBg onBackPress={HandleBackBtn} title={'Your Rides'} />

            <ToggleHeader
                options={Header_Options}
                callback={ToggleHeaderCallback}
            />
            <DurationFilter
                callback={DurationFilterCallback}
            />
            <View
                style={yourRidesStyles.ridesContainerItems}
            >
                {
                    isRefreshing ? (
                        <View style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: 'white',
                            flex: 1
                        }}>
                            <ActivityIndicator size="large" color="#2785ff" />
                        </View>
                    ) :

                        !Rides || Rides.length == 0 ?
                            <NoTripsFound text="No Trips Found" /> :

                            <RecyclerListView
                                contentContainerStyle={{ paddingBottom: 150 }}
                                dataProvider={dataProvider}
                                layoutProvider={layoutProvider}
                                rowRenderer={rowRenderer}
                                renderFooter={renderFooter}
                                canChangeSize={true}
                                forceNonDeterministicRendering={true}
                                scrollViewProps={{
                                    showsHorizontalScrollIndicator: false,
                                    showsVerticalScrollIndicator: false
                                }}
                            />

                    // <FlatList
                    //     data={Rides}
                    //     renderItem={({ item, index }) => { return <RenderTrip ride={item} index={index} /> }}
                    //     keyExtractor={(item, idx) => `your-ride-${idx}`}
                    //     refreshing={isRefreshing}
                    //     onRefresh={HandleRefresh}
                    //     onEndReached={HandleLoadMore}
                    //     onEndReachedThreshold={0.5}
                    //     ListFooterComponent={RenderFlooter}
                    // />
                }
            </View>

        </View>
    )
}

export default YourRidesScreen;