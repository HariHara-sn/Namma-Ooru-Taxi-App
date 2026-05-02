import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
const { width: windowWidth } = Dimensions.get('window');

import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview';
import { yourRidesStyles } from '../../../styles/YourRidesStyles';
import { utils } from '../../../utils/Utils';
import useScheduleTripStore from '../../../store/useScheduleTripStore';

import NoTripsFound from '../../../components/NoTripsFound';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import TripPersonVehicle from '../components/TripPersonVehicle';
import RideItemSkeleton from '../components/RideItemSkeleton';
import { colors } from '../../../constants/constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PropTypes from 'prop-types';

const UpcomingRidesScreen = () => {
    const { t } = useTranslation();
    const { setStackScreen } = useStackScreenStore();
    const { scheduledTrips } = useScheduleTripStore();
    
    const [isRefreshing] = useState(false);

    const HandleTripOpen = (trip) => {
        // Navigate to ScheduleScreen with trip data
        setStackScreen('ScheduleScreen', { trip: trip });
    }

    const RenderTrip = ({ trip, index }) => {
        const fareRangeLabel = trip?.minFare != null && trip?.maxFare != null
            ? `₹${Math.round(trip.minFare)} - ₹${Math.round(trip.maxFare)}`
            : trip?.minFare != null
            ? `₹${Math.round(trip.minFare)}`
            : '₹0';

        const scheduleDate = trip.scheduleDateTime ? utils.formatScheduleDateTimeLabel(trip.scheduleDateTime) : '';
        const dropAddress = Array.isArray(trip?.stops) && trip.stops.length > 0
            ? trip.stops[trip.stops.length - 1]?.address || '--'
            : '--';

        return (
            <TouchableOpacity
                key={`scheduled-trip-${index}`}
                style={yourRidesStyles.ridesContainerItem}
                onPress={() => HandleTripOpen(trip)}
            >
                <View style={yourRidesStyles.ridesContainerItemLeft}>
                    <View>
                        <Text style={yourRidesStyles.ridesContainerItemTitle}>{scheduleDate || '--'}</Text>
                        <Text style={yourRidesStyles.ridesContainerItemDesc} numberOfLines={2} ellipsizeMode='tail'>
                            {dropAddress}
                        </Text>
                    </View>
                    <View style={yourRidesStyles.ridesContainerItemFareContainer}>
                        <Text style={yourRidesStyles.ridesContainerItemFare}>
                            {fareRangeLabel}
                        </Text>
                        <Text style={[yourRidesStyles.ridesContainerItemStatus, { color: colors.blue }]}>
                            {t('scheduled')}
                        </Text>
                    </View>
                </View>
                <View style={yourRidesStyles.ridesContainerItemRight}>
                    <TripPersonVehicle 
                        usedScreen={'MyRides'}
                        driverName={trip?.driverInfo?.driverName || trip?.driver?.name} 
                        driverPhoto={trip?.driverInfo?.driverPhoto || trip?.driver?.photo} 
                        vehicleType={trip?.vehicleType} 
                        vehicleBrand={trip?.driverInfo?.vehicleBrand} 
                        vehicleModel={trip?.driverInfo?.vehicleModel} 
                        vehicleNumber={trip?.driverInfo?.vehicleNumber} 
                    />
                </View>
              
                <Icon name="chevron-right" size={20} color={colors.dark} />
            </TouchableOpacity>
        )
    }

    RenderTrip.propTypes = {
        trip: PropTypes.shape({
            scheduleDateTime: PropTypes.any,
            stops: PropTypes.array,
            vehicleType: PropTypes.string,
            driverInfo: PropTypes.object,
            driver: PropTypes.object,
            fareDetails: PropTypes.object,
            minFare: PropTypes.number,
            maxFare: PropTypes.number,
        }),
        index: PropTypes.number,
    };

    const dataProvider = useMemo(() => {
        return new DataProvider((r1, r2) => r1 !== r2).cloneWithRows(scheduledTrips || []);
    }, [scheduledTrips]);

    const layoutProvider = useMemo(() => {
        return new LayoutProvider(
            () => 1,
            (type, dim) => {
                dim.width = windowWidth;
                dim.height = 180;
            }
        );
    }, []);

    const rowRenderer = React.useCallback((type, data, index) => {
        return <RenderTrip trip={data} index={index} />
    }, []);

    return (
        <View style={yourRidesStyles.mainContainer}>
            <View style={yourRidesStyles.ridesContainerItems}>
                {
                    isRefreshing ? (
                        <View style={{
                            backgroundColor: 'white',
                            flex: 1
                        }}>
                            {Array.from({ length: 5 }, (_, index) => (
                                <RideItemSkeleton key={index} />
                            ))}
                        </View>
                    ) :

                        !scheduledTrips || scheduledTrips.length === 0 ?
                            <NoTripsFound text={t('no_upcoming_rides') || 'No upcoming rides'} /> :

                            <RecyclerListView
                                contentContainerStyle={{ paddingBottom: 150 }}
                                dataProvider={dataProvider}
                                layoutProvider={layoutProvider}
                                rowRenderer={rowRenderer}
                                canChangeSize={true}
                                forceNonDeterministicRendering={true}
                                scrollViewProps={{
                                    showsHorizontalScrollIndicator: false,
                                    showsVerticalScrollIndicator: false
                                }}
                            />
                }
            </View>
        </View>
    )
}

export default UpcomingRidesScreen;