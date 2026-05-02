import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import NavBar from '../../../components/NavBar';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import MapIcon from '../../../components/Map/MapIcon';
import CurrentLocationIcon from '../../../assets/icons/CurrentLocationIcon.svg';
import AddStopIcon from '../../../assets/icons/AddStopIcon.svg';
import { height, width } from '../../../utils/Utils';
import { utils } from '../../../utils/Utils';
import { colors, Fonts } from '../../../constants/constants';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import RouteStatusOverlay from '../../../components/Loaders/RouteStatusOverlay';
import RideInfo from '../components/bookRide/RideInfo';

import useRideBookingInfo from '../store/useRideBookingInfo';
import useRideBookingLocationStore from '../store/useRideBookingLocationStore';
import useDirectionLoad from '../hooks/useDirectionLoad';
import useMapStore from '../../map/store/useMapStore';
import useActingDriverBookTrip from '../hooks/useActingDriverBookTrip';
import { getRideEstimation } from '../../../API/EndPoints/EndPoints';
import { useDebouncedAPICall } from '../../../hooks/useDebounce';
import { showNotification } from '../../../components/NotificationManger';
import AnimatedBottomSheetWrapper from '../../shared/component/AnimatedBottomSheetWrapper';
import PaymentType from '../components/bookRide/PaymentType';
import CouponContainer from '../components/bookRide/CouponConatiner';

import {
    VEHICLE_TYPE_OPTIONS,
    VEHICLE_TYPE_ICON,
} from '../../myVehicles/constants/vehicleData';
import {
    buildKey as buildEstimationCacheKey,
    getFromCache as getEstimationFromCache,
    setInCache as setEstimationInCache,
    prune as pruneEstimationCache,
} from '../store/useEstimationCacheStore';
import vehicleType from '../types/vehicleType.json';

// ─── Bottom sheet header (map + current location button) ─────────────────────
const BottomSheetHeader = (rideDistance, estimatedDuration, setShowPreference) => {
    const { setStackScreen } = useStackScreenStore();
    const { rideStartLocation, rideEndLocation, rideWayPoints } = useRideBookingLocationStore();
    const { setMapBounds } = useMapStore();

    const handleAddStop = () => {
        setStackScreen('WaypointScreen', {});
    };

    const handleCurrentLocation = () => {
        const coords = [
            [rideStartLocation.longitude, rideStartLocation.latitude],
            [rideEndLocation.longitude, rideEndLocation.latitude],
            ...rideWayPoints.map((wp) => [wp.longitude, wp.latitude]),
        ];
        const bounds = utils.getBoundingBox(coords);
        const margin = [50, 100, 50, height * 0.65];
        setMapBounds([bounds, margin]);
    };

    return (
        <View style={styles.bottomSheetHeaderContainer}>
            <View style={styles.bottomSheetHeader}>
                <MapIcon />
                <View style={styles.mapActionContainer}>
                    <TouchableOpacity style={styles.currentLocationIconContainer} onPress={handleCurrentLocation}>
                        <CurrentLocationIcon width={25} height={25} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.currentLocationIconContainer} onPress={handleAddStop}>
                        <AddStopIcon width={25} height={25} />
                    </TouchableOpacity>
                </View>
            </View>
            <RideInfo distance={rideDistance} duration={estimatedDuration} showPreference={setShowPreference} hidePreference={true} />
        </View>
    );
};

// ─── Selected vehicle card ────────────────────────────────────────────────────
const SelectedVehicleCard = ({ vehicle, fare, isLoading }) => {
    const { t } = useTranslation();
    const iconName = VEHICLE_TYPE_ICON[vehicle?.type] || 'car-outline';
    const typeLabel =
        VEHICLE_TYPE_OPTIONS.find((o) => o.value === vehicle?.type)?.label ||
        vehicle?.type ||
        '';
    const meta = [typeLabel, vehicle?.make, vehicle?.model, vehicle?.year]
        .filter(Boolean)
        .join(' · ');

    return (
        <View style={styles.vehicleCard}>
            <View style={styles.vehicleIconBox}>
                <Ionicons name={iconName} size={30} color={colors.black} />
            </View>
            <View style={styles.vehicleInfo}>
                <AdaptiveText style={styles.vehicleRegNo}>{vehicle?.regNo}</AdaptiveText>
                {!!meta && <AdaptiveText style={styles.vehicleMeta}>{meta}</AdaptiveText>}
                {vehicle?.verified && (
                    <View style={styles.verifiedRow}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.green} />
                        <AdaptiveText style={styles.verifiedText}>{t('verified', 'Verified')}</AdaptiveText>
                    </View>
                )}
            </View>
            <View style={styles.fareBox}>
                {isLoading ? (
                    <ActivityIndicator size="small" color={colors.black} />
                ) : fare ? (
                    <>
                        <AdaptiveText style={styles.fareLabel}>{t('est_fare', 'Est. Fare')}</AdaptiveText>
                        <AdaptiveText style={styles.fareValue}>{fare}</AdaptiveText>
                    </>
                ) : null}
            </View>
        </View>
    );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
const BookActingDriverScreen = () => {
    const { t } = useTranslation();
    const { goBack, goBackToScreen } = useStackScreenStore();

    const {
        paymentType,
        setPaymentType,
        rideDistance,
        estimatedDuration,
        updateBookingInfo,
        actingDriverVehicle,
        setRegionOfficeId,
        setRegionOfficeCode,
        couponCode,
    } = useRideBookingInfo();

    const { rideStartLocation, rideEndLocation, rideWayPoints } = useRideBookingLocationStore();

    const {
        transformRideLocationsToDirectionPoints,
        isRideLocationsReady,
    } = useDirectionLoad();

    const { setDirectionPoints, routeLoading, setRouteLoading } = useMapStore();

    const {
        bookTrip,
        isLoading: isBookingLoading,
        isBookingReady,
        getBookingValidationErrors,
    } = useActingDriverBookTrip();

    const [isPaymentTypeOpen, setIsPaymentTypeOpen] = useState(false);
    const [showPreference, setShowPreference] = useState(false);
    const [showCoupon, setShowCoupon] = useState(false);
    const [isEstimationLoading, setIsEstimationLoading] = useState(false);
    const [fareDisplay, setFareDisplay] = useState(null);
    const estimationInFlightRef = useRef(false);
    const longLoadTimerRef = useRef(null);

    const [layoutHeight, setLayoutHeight] = useState(0);

      const layOutChange = (event) => {
        const {width, height} = event.nativeEvent.layout;
        setLayoutHeight(height);
    }

    // ── Route ──────────────────────────────────────────────────────────────────
    const loadRoute = async () => {
        const result = await transformRideLocationsToDirectionPoints({
            clearMarkers: true,
            vehicleType: 'car',
            padding: [50, 50, 50, height * 0.5],
        });
        if (result.success) {
            const distanceKm = Number(result.distance);
            const durationMin = Number(result.duration) / 60;
            updateBookingInfo({
                rideDistance: Number.isFinite(distanceKm) ? distanceKm.toFixed(1) : null,
                estimatedDuration: Number.isFinite(durationMin) ? Math.max(1, Math.round(durationMin)) : 1,
            });
        }
    };

    useEffect(() => {
        loadRoute();
        return () => {
            setDirectionPoints(null);
            updateBookingInfo({ rideDistance: null, estimatedDuration: null });
        };
    }, []);

    // ── Fare estimation ────────────────────────────────────────────────────────
    const onEstimationSuccess = useCallback(
        (data) => {
            if (data?.result?.success) {
                if (data?.regionCode) setRegionOfficeCode(data.regionCode);
                if (data?.regionOfficeId) setRegionOfficeId(data.regionOfficeId);

                const fareRanges = data?.result?.data?.fareRanges;
                const vehicleT = actingDriverVehicle?.type;
                if (fareRanges && vehicleT && fareRanges[vehicleT]) {
                    const { minFare, maxFare, currency } = fareRanges[vehicleT];
                    const symbol = currency || '₹';
                    if (minFare && maxFare) {
                        setFareDisplay(`${symbol}${minFare} – ${symbol}${maxFare}`);
                    } else if (minFare) {
                        setFareDisplay(`${symbol}${minFare}+`);
                    }
                } else {
                    // fallback: pick any first entry
                    const firstKey = fareRanges ? Object.keys(fareRanges)[0] : null;
                    if (firstKey) {
                        const { minFare, maxFare, currency } = fareRanges[firstKey];
                        const symbol = currency || '₹';
                        setFareDisplay(`${symbol}${minFare} – ${symbol}${maxFare}`);
                    }
                }
            } else {
                showNotification(
                    t('ride_estimation_title'),
                    data?.message || t('failed_to_get_fare_estimation'),
                    'danger',
                );
            }
        },
        [actingDriverVehicle],
    );

    const estimationCaller = useCallback(
        async (payload, cacheKey) => {
            if (estimationInFlightRef.current) return;
            estimationInFlightRef.current = true;
            try {
                setIsEstimationLoading(true);
                if (longLoadTimerRef.current) clearTimeout(longLoadTimerRef.current);
                const data = await getRideEstimation(payload);
                if (cacheKey && data?.result?.success) setEstimationInCache(cacheKey, data);
                onEstimationSuccess(data);
            } catch (_) {
                showNotification(t('ride_estimation_title'), t('request_failed'), 'danger');
            } finally {
                estimationInFlightRef.current = false;
                setIsEstimationLoading(false);
                if (longLoadTimerRef.current) {
                    clearTimeout(longLoadTimerRef.current);
                    longLoadTimerRef.current = null;
                }
            }
        },
        [onEstimationSuccess],
    );

    const debouncedGetRideEstimation = useDebouncedAPICall(estimationCaller, 500);

    useEffect(() => {
        return () => {
            if (debouncedGetRideEstimation?.cancel) debouncedGetRideEstimation.cancel();
        };
    }, []);

    const getEstimatedFare = useCallback(() => {
        const cacheKey = buildEstimationCacheKey({
            start: rideStartLocation,
            end: rideEndLocation,
            waypoints: rideWayPoints,
        });
        pruneEstimationCache();
        const cached = getEstimationFromCache(cacheKey);
        if (cached) {
            onEstimationSuccess(cached);
            return;
        }
        const payload = {
            distance: rideDistance,
            duration: estimatedDuration,
            coordinates: [rideStartLocation?.longitude, rideStartLocation?.latitude],
        };
        debouncedGetRideEstimation(payload, cacheKey);
    }, [rideDistance, estimatedDuration, rideStartLocation, rideEndLocation, rideWayPoints]);

    useEffect(() => {
        if (rideDistance && estimatedDuration) {
            getEstimatedFare();
        }
    }, [rideDistance, estimatedDuration]);

    // ── Actions ────────────────────────────────────────────────────────────────
    const handleBackPress = () => {
        updateBookingInfo({ rideDistance: null, estimatedDuration: null });
        goBack();
    };

    const handleConfirm = async () => {
        if (!isBookingReady()) {
            const errors = getBookingValidationErrors();
            console.log('Acting driver booking validation errors:', errors);
            return;
        }
        try {
            await bookTrip();
        } catch (error) {
            console.error('Acting driver booking failed:', error);
        }
    };

    const handleRetry = () => {
        if (rideDistance && estimatedDuration) getEstimatedFare();
        else loadRoute();
    };

    const onRetryFetchRoute = () => loadRoute();

    const handleCouponPress = () => setShowCoupon(true);

    return (
        <>
            <View>
                <NavBar elevation onBackPress={handleBackPress} />
            </View>

            <BottomSheetWrapper
                snapPoints={[380]}
                index={0}
                enablePanDownToClose={false}
                enableOverDrag={true}
                enableScroll={true}
                handleComponent={() => BottomSheetHeader(rideDistance, estimatedDuration, setShowPreference)}
                handleIndicatorStyle={{ backgroundColor: '#DEDEDE', width: 50, height: 4 }}
            >
                {/* Selected vehicle */}
                <View style={styles.sectionContainer}>
                    <AdaptiveText style={styles.sectionTitle}>
                        {t('your_vehicle', 'Your Vehicle')}
                    </AdaptiveText>
                    {actingDriverVehicle ? (
                        <SelectedVehicleCard
                            vehicle={actingDriverVehicle}
                            fare={fareDisplay}
                            isLoading={isEstimationLoading}
                        />
                    ) : (
                        <AdaptiveText style={styles.noVehicleText}>
                            {t('no_vehicle_selected', 'No vehicle selected')}
                        </AdaptiveText>
                    )}
                </View>

                <View style={{ height: 120 }} />
            </BottomSheetWrapper>

            {/* Coupon row */}
            <TouchableOpacity style={[styles.couponContainer, { bottom: layoutHeight }]} onPress={handleCouponPress}>
                {!couponCode ? (
                    <>
                        <FontAwesome6 name="percent" size={20} color={colors.black} />
                        <AdaptiveText style={styles.couponText}>{t('offer_coupons', 'Offer & Coupons')}</AdaptiveText>
                        <Icon name="chevron-right" size={20} color="#888" />
                    </>
                ) : (
                    <>
                        <FontAwesome6 name="percent" size={16} color={colors.grey_dark} />
                        <AdaptiveText>{t('coupon', 'Coupon')}</AdaptiveText>
                        <AdaptiveText style={[styles.couponText, { fontFamily: Fonts.semi_bold }]}>{couponCode}</AdaptiveText>
                        <AdaptiveText>{t('applied', 'Applied')}</AdaptiveText>
                    </>
                )}
            </TouchableOpacity>

            {/* Bottom action bar */}
            <View onLayout={layOutChange} style={styles.bottomContainer}>
                <View style={styles.bookingButtonContainer}>
                    <TouchableOpacity
                        style={styles.paymentContainer}
                        onPress={() => setIsPaymentTypeOpen(true)}
                        activeOpacity={0.8}
                    >
                        <AdaptiveText style={styles.payByLabel}>{t('pay_by')}</AdaptiveText>
                        <View style={styles.paymentMode}>
                            <AdaptiveText style={styles.paymentModeText}>{paymentType}</AdaptiveText>
                            <Icon name="arrow-drop-down" color={colors.white} style={{ fontSize: 20 }} />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.confirmSection}>
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (!actingDriverVehicle || isBookingLoading || routeLoading?.loading) &&
                                    styles.confirmButtonDisabled,
                                isBookingLoading && { backgroundColor: colors.orange },
                            ]}
                            onPress={handleConfirm}
                            disabled={!actingDriverVehicle || isBookingLoading || !!routeLoading?.loading}
                            activeOpacity={0.85}
                        >
                            <AdaptiveText style={styles.confirmButtonText}>
                                {isBookingLoading
                                    ? t('booking')
                                    : t('confirm_booking', 'Confirm Booking')}
                            </AdaptiveText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <RouteStatusOverlay
                loading={!!routeLoading?.loading}
                error={routeLoading?.error}
                onBack={handleBackPress}
                onRetry={onRetryFetchRoute}
                top={height * 0.25}
            />

            {isPaymentTypeOpen && (
                <AnimatedBottomSheetWrapper
                    onClose={() => setIsPaymentTypeOpen(false)}
                    zIndex={100000}
                >
                    <PaymentType
                        onSelect={(pt) => {
                            setPaymentType(pt);
                            setIsPaymentTypeOpen(false);
                        }}
                        initialValue={paymentType}
                    />
                </AnimatedBottomSheetWrapper>
            )}

            {showCoupon && (
                <AnimatedBottomSheetWrapper onClose={() => setShowCoupon(false)} zIndex={100000}>
                    <CouponContainer />
                </AnimatedBottomSheetWrapper>
            )}
        </>
    );
};

export default BookActingDriverScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    // ── Bottom sheet header ──────────────────────────────────────────────────
    bottomSheetHeaderContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    bottomSheetHeader: {
        position: 'absolute',
        width: width,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        top: -115,
        paddingHorizontal: 10,
    },
    mapActionContainer: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        gap: 10,
        paddingBottom: 10,
    },
    currentLocationIconContainer: {
        padding: 10,
        borderRadius: 30,
        backgroundColor: 'white',
        elevation: 5,
    },
    // ── Section ──────────────────────────────────────────────────────────────
    sectionContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: Fonts.semi_bold,
        color: colors.black,
        marginBottom: 10,
    },
    noVehicleText: {
        fontSize: 13,
        color: colors.grey_dark,
        fontFamily: Fonts.regular,
    },
    // ── Vehicle card ─────────────────────────────────────────────────────────
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.black,
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#FAFAFA',
        gap: 12,
    },
    vehicleIconBox: {
        width: 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: '#F0EFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    vehicleInfo: {
        flex: 1,
        gap: 3,
    },
    vehicleRegNo: {
        fontSize: 15,
        fontFamily: Fonts.semi_bold,
        color: colors.black,
    },
    vehicleMeta: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: colors.grey_dark,
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    verifiedText: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: colors.green,
    },
    fareBox: {
        alignItems: 'flex-end',
        minWidth: 70,
    },
    fareLabel: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: colors.grey_dark,
    },
    fareValue: {
        fontSize: 15,
        fontFamily: Fonts.semi_bold,
        color: colors.black,
        marginTop: 2,
    },
    // ── Coupon row ───────────────────────────────────────────────────────────
    couponContainer: {
        position: 'absolute',
        bottom: height * 0.15,
        left: 0,
        right: 0,
        width: '100%',
        paddingHorizontal: 15,
        paddingVertical: 10,
        zIndex: 99999,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#fffae2',
    },
    couponText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: colors.black,
    },
    // ── Bottom bar ───────────────────────────────────────────────────────────
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100000,
        elevation: 10,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: '#e0e0e0',
    },
    bookingButtonContainer: {
        backgroundColor: colors.black,
        width: '100%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        flexDirection: 'row',
        padding: 10,
        elevation: 5,
    },
    paymentContainer: {
        width: '30%',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingHorizontal: 15,
    },
    payByLabel: {
        fontSize: 12,
        color: colors.white,
        fontFamily: Fonts.regular,
    },
    paymentMode: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    paymentModeText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: colors.white,
    },
    confirmSection: {
        width: '70%',
    },
    confirmButton: {
        width: '100%',
        padding: 15,
        backgroundColor: colors.green,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'white',
    },
    confirmButtonDisabled: {
        backgroundColor: colors.grey_light,
        opacity: 0.7,
    },
    confirmButtonText: {
        color: colors.white,
        fontSize: 14,
        fontFamily: Fonts.medium,
        textAlign: 'center',
    },
});
