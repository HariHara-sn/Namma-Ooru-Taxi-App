import { Dimensions, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
const { width: windowWidth } = Dimensions.get('window');

import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview';
import { yourRidesStyles } from '../../../styles/YourRidesStyles';
import { showNotification } from '../../../components/NotificationManger';
import { utils } from '../../../utils/Utils';
import { getCustomerTrips } from '../../../API/EndPoints/EndPoints';

import NavBar from '../../../components/NavBar';
import NoTripsFound from '../../../components/NoTripsFound';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import TripPersonVehicle from '../components/TripPersonVehicle';
import RideItemSkeleton from '../components/RideItemSkeleton';
import LoadingToast from '../../../components/LoadingToast';
import { useRideHistoryStore } from '../store/useRideHistoryStore';
import { colors, Fonts } from '../../../constants/constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DateTimeFormatter } from '../../../utils/DateTimeFormatter';
import PropTypes from 'prop-types';
import DatePicker from 'react-native-date-picker';
import EnhancedDateRangeBottomSheet from '../../shared/component/EnhancedDateRangeBottomSheet';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import { getPresignedImageUrl } from '../../../../common/utils/getPresignedImageUrl';

const extractDriverPhotoKey = value => {
    if (typeof value !== 'string') {
        return { raw: null, key: null };
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return { raw: null, key: null };
    }
    const strippedDomain = trimmed.replace(/^https?:\/\/[^/]+\/?/, '').replace(/^\//, '');
    const [normalizedKey] = strippedDomain.split('?');
    return { raw: trimmed, key: normalizedKey || null };
};

const YourRidesScreen = () => {
    const { t } = useTranslation();
    const { setStackScreen } = useStackScreenStore();
    const { Rides, setRides } = useRideHistoryStore();
    const { userdetails } = useUserInfoStore();
    const userToken = userdetails?.token || null;
    const [driverPhotoMap, setDriverPhotoMap] = useState({});
    const [driverPhotoLoadingMap, setDriverPhotoLoadingMap] = useState({});
    

    const [FilterStart, setFilterStart] = useState('');
    const [FilterEnd, setFilterEnd] = useState('');
    const [FilterLimit] = useState(10);
    const [isRefreshing, setIsRefreshing] = useState(true);
    const [isLoadMore, setIsLoadMore] = useState(false);
    const [showLoadingToast, setShowLoadingToast] = useState(false);
    const [durationFilterSet, setDurationFilterSet] = useState(false);
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreData, setHasMoreData] = useState(true);
    // Filter state
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isFilterActive, setIsFilterActive] = useState(false);
    // Temporary filter state (for bottom sheet)
    const [tempSelectedStatus, setTempSelectedStatus] = useState('');
    const [tempCustomStartDate, setTempCustomStartDate] = useState(null);
    const [tempCustomEndDate, setTempCustomEndDate] = useState(null);
    const [isCustomDateRangeSelected, setIsCustomDateRangeSelected] = useState(false);
    const [tempIsDateRangeEnabled, setTempIsDateRangeEnabled] = useState(false);
    // Custom date range state
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState('start');
    const [customStartDate, setCustomStartDate] = useState(new Date());
    const [customEndDate, setCustomEndDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('today');

    // Function to get today's date range
    const getTodayDateRange = () => {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        
        return {
            start: startOfDay.getTime(),
            end: endOfDay.getTime()
        };
    };


  

    // Replace useQuery with normal API call
    const LoadRides = async (page = 1, isLoadMoreRequest = false) => {
        try {
            let payload = {
                page: page,
                limit: FilterLimit
            }
            
            // Only add date filters if provided (today/week/custom). Skip for "all".
            if (FilterStart !== null && FilterEnd !== null) {
                let startTime = FilterStart;
                let endTime = FilterEnd;

                if (typeof startTime === 'string') {
                    startTime = new Date(startTime).getTime();
                }
                if (typeof endTime === 'string') {
                    endTime = new Date(endTime).getTime();
                }

                payload.startTime = startTime;
                payload.endTime = endTime;
            }

            // Add status filter if selected
            if (selectedStatus) {
                payload.status = selectedStatus;
            }

            if (!isLoadMoreRequest) {
                setIsRefreshing(true);
                setShowLoadingToast(true);
            } else {
                setIsLoadMore(true);
            }
           

            if(payload?.status && !isCustomDateRangeSelected){
                delete payload?.startTime;
                delete payload?.endTime;
            }
            
            const data = await getCustomerTrips(payload);
            
            if (data.success) {
                let { trips, pagination } = data;
                
                if (isLoadMoreRequest) {
                    setRides([...Rides, ...trips]);
                } else {
                    setRides(trips);
                }
                
                // Update pagination state
                if (pagination) {
                    setCurrentPage(pagination.page);
                    setHasMoreData(pagination.page < pagination.totalPages);
                }
            } else {
                showNotification(t('failed_to_get_rides'), data.message, 'danger');
            }
        } catch (error) {
            console.error('Error loading rides:', error);
            showNotification(t('failed_to_get_rides'), t('network_error_occurred'), 'danger');
        } finally {
            setIsRefreshing(false);
            setIsLoadMore(false);
            setShowLoadingToast(false);
        }
    }


    const HandleRideOpen = (ride) => {
        // Navigate to RideDetailScreen with ride data
        setStackScreen('RideDetailScreen', { TripData: ride });     
    }


    const HandleLoadMore = () => {
        if (isRefreshing || isLoadMore || !hasMoreData) return;
        const nextPage = currentPage + 1;
        LoadRides(nextPage, true);
    }

    useEffect(() => {
        let cancelled = false;

        if (!Array.isArray(Rides) || Rides.length === 0) {
            setDriverPhotoMap({});
            setDriverPhotoLoadingMap({});
            return undefined;
        }

        const pendingKeys = new Set();
        Rides.forEach(ride => {
            const { key } = extractDriverPhotoKey(ride?.driverInfo?.driverPhoto);
            if (key) pendingKeys.add(key);
        });

        if (!userToken || pendingKeys.size === 0) {
            if (!userToken) setDriverPhotoLoadingMap({});
            return undefined;
        }

        const keysToFetch = Array.from(pendingKeys);
        setDriverPhotoLoadingMap(prev => {
            const updated = { ...prev };
            keysToFetch.forEach(key => {
                updated[key] = true;
            });
            return updated;
        });

        (async () => {
            const results = await Promise.all(
                keysToFetch.map(async key => {
                    try {
                        const url = await getPresignedImageUrl(key, userToken);
                        return { key, url: url || null };
                    } catch (error) {
                        return { key, url: null };
                    }
                })
            );

            if (cancelled) return;

            const resolved = {};
            results.forEach(({ key, url }) => {
                resolved[key] = url;
            });

            if (Object.keys(resolved).length > 0) {
                setDriverPhotoMap(prev => ({ ...prev, ...resolved }));
            }

            setDriverPhotoLoadingMap(prev => {
                const updated = { ...prev };
                keysToFetch.forEach(key => {
                    updated[key] = false;
                });
                return updated;
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [Rides, userToken]);

    const RenderTrip = ({ ride,Fare, index }) => {
        const { raw: driverPhotoRaw, key: driverPhotoKey } = extractDriverPhotoKey(ride?.driverInfo?.driverPhoto);
        const driverPhoto = driverPhotoKey ? driverPhotoMap[driverPhotoKey] : driverPhotoRaw;
        const driverPhotoLoading = driverPhotoKey ? !!driverPhotoLoadingMap[driverPhotoKey] : false;
        const showDriverPhotoPlaceholder = Boolean(driverPhotoKey || driverPhotoRaw);

        return (
            <TouchableOpacity
                key={`your-ride-${index}`}
                style={yourRidesStyles.ridesContainerItem}
                onPress={() => HandleRideOpen(ride)}
            >
                <View
                    style={yourRidesStyles.ridesContainerItemLeft}
                >
                    <View>
                    <Text style={yourRidesStyles.ridesContainerItemTitle}>{utils.formateDateLabel(ride.bookingTime, 'local')}</Text>
                    <Text style={yourRidesStyles.ridesContainerItemDesc} numberOfLines={2} ellipsizeMode='tail'>
                        {Array.isArray(ride?.stops) && ride.stops.length > 0
                            ? ride.stops[ride.stops.length - 1]?.address || '--'
                            : '--'}
                    </Text>
                    </View>
                    <View style={yourRidesStyles.ridesContainerItemFareContainer}>
                    <Text style={yourRidesStyles.ridesContainerItemFare}>
                    {Fare != null && !isNaN(Fare) ? `₹ ${Fare.toFixed(2)} .` : ''} 
                    </Text>
                    <Text style={[yourRidesStyles.ridesContainerItemStatus,ride?.status=="COMPLETED"&&{color:'green'},ride?.status=="DIVERGED"&&{color:'orange'},ride?.status=="CANCELLED"&&{color:'red'}]}>{t(utils.getShortRideStatus(ride?.status))}</Text>
                    </View>
                </View>
                <View
                    style={yourRidesStyles.ridesContainerItemRight}
                >
                    <TripPersonVehicle 
                        usedScreen={'MyRides'}
                        driverName={ride?.driverInfo?.driverName} 
                        driverPhoto={driverPhoto || undefined} 
                        driverPhotoLoading={driverPhotoLoading}
                        showDriverPhotoPlaceholder={showDriverPhotoPlaceholder}
                        vehicleType={ride?.vehicleType} 
                        vehicleBrand={ride?.driverInfo?.vehicleBrand} 
                        vehicleModel={ride?.driverInfo?.vehicleModel} 
                        vehicleNumber={ride?.driverInfo?.vehicleNumber} 
                    />
                </View>
              
                <Icon name="chevron-right" size={20} color={colors.dark} />
            </TouchableOpacity>
        )
    }

    RenderTrip.propTypes = {
		ride: PropTypes.shape({
			bookingTime: PropTypes.any,
			stops: PropTypes.array,
			status: PropTypes.string,
			driverInfo: PropTypes.object,
			vehicleType: PropTypes.string,
		}),
		Fare: PropTypes.number,
		index: PropTypes.number,
	};

  

    const dataProvider = React.useMemo(() => {
      
        return new DataProvider((r1, r2) => r1 !== r2).cloneWithRows(Rides);
    }, [Rides]);

    const layoutProvider = React.useMemo(() => {
        return new LayoutProvider(
            () => 1,
            (type, dim) => {
                dim.width = windowWidth;
                dim.height = 180;
            }
        );
    }, []);

    const rowRenderer = (type, data, index) => (
        <RenderTrip
            ride={data}
            Fare={data?.fareDetails?.fare}
            index={index}
        />
    );

    const extendedState = React.useMemo(
        () => ({
            driverPhotoMap,
            driverPhotoLoadingMap,
        }),
        [driverPhotoMap, driverPhotoLoadingMap],
    );

    const renderFooter = React.useCallback(() => {
        if (isLoadMore) {
            return (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            );
        }
        return null;
    }, [isLoadMore]);

    // Set default date filters to today when component mounts
    useEffect(() => {
        const todayRange = getTodayDateRange();
        setFilterStart(todayRange.start);
        setFilterEnd(todayRange.end);
        setDurationFilterSet(true);
    }, []);

    // Update filter active state based on current filters
    useEffect(() => {
        const hasCustomDateRange = isCustomDateRangeSelected && activeTab === 'custom';
        const hasStatusFilter = selectedStatus !== '';
        setIsFilterActive(hasCustomDateRange || hasStatusFilter);
    }, [isCustomDateRangeSelected, selectedStatus, activeTab]);

    useEffect(() => {
        if(durationFilterSet){
            setCurrentPage(1);
            setHasMoreData(true);
            LoadRides(1, false);
        }
    }, [durationFilterSet, FilterStart, FilterEnd, selectedStatus])

  


    // Handlers for custom date range
    const openDatePicker = (mode) => {
        setDatePickerMode(mode);
        setShowDatePicker(true);
    };

    const handleDateChange = (date) => {
        if (datePickerMode === 'start') {
            setTempCustomStartDate(date);
            // If the new start date is after the end date, clear the end date
            if (tempCustomEndDate && date > tempCustomEndDate) {
                setTempCustomEndDate(null);
            }
        } else {
            setTempCustomEndDate(date);
            // If the new end date is before the start date, clear the start date
            if (tempCustomStartDate && date < tempCustomStartDate) {
                setTempCustomStartDate(null);
            }
        }
        setShowDatePicker(false);
    };

    const handleDatePickerCancel = () => {
        setShowDatePicker(false);
    };

    const handleCustomDateConfirm = () => {
        setShowCustomDatePicker(false);
        
        // Apply temporary filters to actual filters
        setSelectedStatus(tempSelectedStatus);
        
        // Only apply custom date range if switch is enabled and dates are selected
        if (tempIsDateRangeEnabled && tempCustomStartDate && tempCustomEndDate) {
            const startTimestamp = tempCustomStartDate.getTime();
            const endOfDay = new Date(tempCustomEndDate);
            endOfDay.setHours(23, 59, 59, 999);
            const endTimestampWithTime = endOfDay.getTime();
            setFilterStart(startTimestamp);
            setFilterEnd(endTimestampWithTime);
            setCustomStartDate(tempCustomStartDate);
            setCustomEndDate(tempCustomEndDate);
            setIsCustomDateRangeSelected(true);
        } else {
            setIsCustomDateRangeSelected(false);
        }
        
        setCurrentPage(1);
        setHasMoreData(true);
        setDurationFilterSet(true);
        setIsFilterActive(true);
        setActiveTab('custom'); // Set custom tab as active
    };

    const handleStatusChange = (status) => {
        setTempSelectedStatus(status);
    };

    const handleClearFilters = () => {
        setShowCustomDatePicker(false);
        const todayRange = getTodayDateRange();
        setFilterStart(todayRange.start);
        setFilterEnd(todayRange.end);
        setSelectedStatus('');
        setTempSelectedStatus('');
        setIsCustomDateRangeSelected(false);
        setTempIsDateRangeEnabled(false);
        setCurrentPage(1);
        setHasMoreData(true);
        setDurationFilterSet(true);
        setIsFilterActive(false);
        setActiveTab('today'); // Reset to today tab
    };

    const handleClearDateRange = () => {
        setTempCustomStartDate(null);
        setTempCustomEndDate(null);
    };

    const handleDateRangeToggle = (enabled) => {
        setTempIsDateRangeEnabled(enabled);
    };

    const handleOpenFilterSheet = () => {
        // Initialize temporary state with current values
        setTempSelectedStatus(selectedStatus);
        setTempCustomStartDate(isCustomDateRangeSelected ? customStartDate : null);
        setTempCustomEndDate(isCustomDateRangeSelected ? customEndDate : null);
        setTempIsDateRangeEnabled(isCustomDateRangeSelected);
        setShowCustomDatePicker(true);
    };

    const handleCustomDateCancel = () => {
        setShowCustomDatePicker(false);
    };

    return (
        <View style={yourRidesStyles.mainContainer}>
         

            {/* <ToggleHeader
                options={Header_Options}
                callback={ToggleHeaderCallback}
            /> */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16,  gap: 12 }}>
                {[
                    { id: 'today', label: t('today'), getRange: DateTimeFormatter.getTodaysStartEndTime },
                    { id: 'week', label: t('week'), getRange: DateTimeFormatter.getThisWeekStartEndTime },
                    // { id: 'last_week', label: 'Last Week', getRange: DateTimeFormatter.getLastWeekStartEndTime },
                    { id: 'all', label: t('all'), getRange: null },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => {
                            // Reset all custom filters when selecting a tab
                            setSelectedStatus('');
                            setIsFilterActive(false);
                            setIsCustomDateRangeSelected(false);
                            setTempIsDateRangeEnabled(false);
                            
                            if (tab.getRange) {
                                const [start, end] = tab.getRange();
                                setFilterStart(start);
                                setFilterEnd(end);
                            } else {
                                setFilterStart(null);
                                setFilterEnd(null);
                            }
                            setCurrentPage(1);
                            setHasMoreData(true);
                            setDurationFilterSet(true);
                            setActiveTab(tab.id);
                        }}
                        style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: colors.grey_light,
                            borderRadius: 16,
                            backgroundColor: activeTab === tab.id ? colors.black : colors.white,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <AdaptiveText numberOfLines={1} style={{ fontSize:14 ,fontFamily:Fonts.regular}} color={activeTab === tab.id ? colors.white : colors.black}>{tab.label}</AdaptiveText>
                        {/* <AdaptiveText style={{ fontFamily: Fonts.medium, color: activeTab === tab.id ? colors.white : colors.black }}>{tab.label}</AdaptiveText> */}
                    </TouchableOpacity>
                ))}
                {/* Calendar icon for custom date range */}
                <TouchableOpacity
                    onPress={handleOpenFilterSheet}
                    style={{
                        borderWidth: 1,
                        borderColor: colors.grey_light,
                        borderRadius: 16,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: isFilterActive ? colors.black : colors.white,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon name="filter" size={20} color={isFilterActive ? colors.white : colors.black} />
                </TouchableOpacity>
            </View>
            <View
                style={yourRidesStyles.ridesContainerItems}
            >
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

                        !Rides || Rides.length == 0 ?
                            <NoTripsFound text={t('no_trips_found')} /> :

                            <RecyclerListView
                                contentContainerStyle={{ paddingBottom: 150 }}
                                dataProvider={dataProvider}
                                layoutProvider={layoutProvider}
                                rowRenderer={rowRenderer}
                                extendedState={extendedState}
                                renderFooter={renderFooter}
                                canChangeSize={true}
                                forceNonDeterministicRendering={true}
                                onEndReached={HandleLoadMore}
                                onEndReachedThreshold={0.5}
                                scrollViewProps={{
                                    showsHorizontalScrollIndicator: false,
                                    showsVerticalScrollIndicator: false
                                }}
                            />
                }
            </View>
            <LoadingToast 
                visible={showLoadingToast}
                onHide={() => setShowLoadingToast(false)}
            />
            {/* Enhanced Date Range and Status Filter Modal */}
            <EnhancedDateRangeBottomSheet
                visible={showCustomDatePicker}
                onClose={() => setShowCustomDatePicker(false)}
                title={t('select_date_range')}
                clearLabel={t('clear')}
                fromLabel={t('from')}
                toLabel={t('to')}
                startDate={tempCustomStartDate}
                endDate={tempCustomEndDate}
                onPressFrom={() => openDatePicker('start')}
                onPressTo={() => openDatePicker('end')}
                onCancel={handleCustomDateCancel}
                onConfirm={handleCustomDateConfirm}
                onClear={handleClearFilters}
                onClearDateRange={handleClearDateRange}
                cancelLabel={t('cancel')}
                confirmLabel={t('confirm')}
                    
                selectedStatus={tempSelectedStatus}
                onStatusChange={handleStatusChange}
                isDateRangeEnabled={tempIsDateRangeEnabled}
                onDateRangeToggle={handleDateRangeToggle}
            />
            <DatePicker
                modal
                open={showDatePicker}
                date={datePickerMode === 'start' ? (tempCustomStartDate || new Date()) : (tempCustomEndDate || new Date())}
                mode="date"
                onConfirm={handleDateChange}
                onCancel={handleDatePickerCancel}
                maximumDate={new Date()}
            />
        </View>
    )
}

export default YourRidesScreen;