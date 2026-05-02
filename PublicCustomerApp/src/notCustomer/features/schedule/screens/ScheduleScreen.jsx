import React, { useRef, useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, BackHandler } from 'react-native';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import { colors, Fonts } from '../../../constants/constants';
// removed unused tick and cash icon imports
import PropTypes from 'prop-types';
import ScheduleImage from '../../../assets/image/scheduleImage.webp';
import AnimatedBottomSheetWrapper from '../../shared/component/AnimatedBottomSheetWrapper';
import ScheduleContainer from '../../../screens/SearchLocation/ScheduleContainer';
import useRideBookingInfo from '../../booking/store/useRideBookingInfo';
import { utils } from '../../../utils/Utils';
import AddressContainer from '../../../components/Trips/AddressContainer';
import Icon from 'react-native-vector-icons/Ionicons';
import VehicleDriverPreview from '../../../components/Common/VehicleDriverPreview';
import CancelComponent from '../../rideStatus/component/CancelComponent';
import { cancelRide } from '../../../API/EndPoints/EndPoints';
import { showNotification } from '../../../components/NotificationManger';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import useScheduleTripStore from '../../../store/useScheduleTripStore';
import { TripStatus } from '../../rideStatus/types/TripStatus';
import { useTranslation } from 'react-i18next';

const ScheduleScreen = ({ trip, fromBookScreen=false }) => {
	const sheetRef = useRef(null);
	const { scheduleDateTime } = useRideBookingInfo();
	const [showScheduleContainer, setShowScheduleContainer] = useState(false);
	const [showCancelBottomSheet, setShowCancelBottomSheet] = useState(false);
	const [cancelLoading, setCancelLoading] = useState(false);
	const { t } = useTranslation();
	const { goBack, reset } = useStackScreenStore();
	const { removeScheduledTrip } = useScheduleTripStore();
	const schedule = trip || {};



	const onBackPress = () => {
		if(fromBookScreen){
			reset();
		}else{
			goBack();
		}
	};

	useEffect(() => {
		const handleHardwareBackPress = () => {
		  onBackPress();
		  return true;
		};
		const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBackPress);
		return () => {
		  subscription.remove();
		};
	  }, [onBackPress]);

// date label is directly formatted where needed


	const fareRangeLabel = useMemo(() => {
		const hasMin = schedule.minFare != null;
		const hasMax = schedule.maxFare != null;
		if (hasMin && hasMax) return `₹${Math.round(schedule.minFare)} - ₹${Math.round(schedule.maxFare)}`;
		if (hasMin) return `₹${Math.round(schedule.minFare)}`;
		return '₹0';
	}, [schedule.minFare, schedule.maxFare]);

	const timeDistanceLabel = useMemo(() => {
		const mins = schedule.estimatedDuration || 0;
		const distance = Number(schedule.estimatedDistance || 0);
		const minsLabel = utils.formatMinutesToReadable(mins).replace('Mins', 'Min');
		return `${minsLabel}  .  ${distance.toFixed(1)} Km`;
	}, [schedule.estimatedDuration, schedule.estimatedDistance]);

	const oncloseDateTime = () => {
		setShowScheduleContainer(false);
	};
	const onConfirmDateTime = () => {
		setShowScheduleContainer(false);
	};

	const handleCancel = async (reason) => {
		if (!schedule?._id) {
			showNotification(t('error') || 'Error', t('invalid_trip_id') || 'Invalid trip ID', 'danger');
			return;
		}

		setCancelLoading(true);
		try {
			const payload = {
				tripId: schedule.tripId || schedule._id,
				reason: reason,
			};
			const response = await cancelRide(payload);
			
			if (response.success) {
				showNotification(t('ride_cancelled') || 'Ride cancelled successfully');
				// Remove from scheduled trips store
				removeScheduledTrip( schedule._id);
				setShowCancelBottomSheet(false);
				onBackPress();
			} else {
				showNotification(t('failed_to_cancel_ride') || 'Failed to cancel ride', response.message || '', 'danger');
			}
		} catch (error) {
			console.error('Error cancelling scheduled ride:', error);
			showNotification(t('failed_to_cancel_ride') || 'Failed to cancel ride', t('please_try_again') || 'Please try again', 'danger');
		} finally {
			setCancelLoading(false);
		}
		
	};

	const vehicleType = schedule?.vehicleType || 'AUTO';
	const isElectricVehicle =
		vehicleType === 'ELECTRIC_AUTO' || vehicleType === 'ELECTRIC_BIKE' || vehicleType === 'ELECTRIC_HATCHBACK' || vehicleType === 'ELECTRIC_SEDAN' || vehicleType === 'ELECTRIC_SUV' || vehicleType === 'ELECTRIC_EXSEDAN';		
    const DriverImageSource = schedule?.driverData?.driverPhoto || schedule?.driver?.photo || null;; // Assuming no driver photo for scheduled trips
	return (
		<View style={styles.container}>
			<BottomSheetWrapper
				ref={sheetRef}
				index={1}
				enableScroll
				snapPoints={['40%', '100%']}
				style={styles.sheet}
			>
				{/* Header */}
				<View style={styles.headerWrap}>
					<Image source={ScheduleImage} style={styles.calendarImg} resizeMode="contain" />
					<AdaptiveText style={styles.headerTitle}>{fromBookScreen?"Scheduled Ride Booked Successfully":"Scheduled Ride"}</AdaptiveText>
					<AdaptiveText style={styles.headerSub}>Your driver will be assigned 10 minutes before scheduled time</AdaptiveText>
				</View>
				<View style={styles.dashedDivider} />

				<View style={styles.estimateBlock}>
					<AdaptiveText style={styles.estimateTitle}>Estimated Amount to Pay (Price may vary)</AdaptiveText>
					<AdaptiveText style={styles.estimatePrice}>{fareRangeLabel}</AdaptiveText>
					<View style={styles.timeDistancePill}>
						<AdaptiveText style={styles.timeDistanceText}>{timeDistanceLabel}</AdaptiveText>
					</View>
				</View>

				<View style={styles.cardsRow}>
					<View style={[styles.tileCard, { marginRight: 10,display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'space-between'}]}>
						 <VehicleDriverPreview
								vehicleType={vehicleType}
								driverPhoto={DriverImageSource}
								isElectricVehicle={isElectricVehicle}
							/>
					</View>
					<View style={styles.tileCard}>
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
							<View style={{ flexDirection: 'column', alignItems: 'center', flex: 1 ,gap: 10}}>
								<Icon name="time-outline" color={colors.black} size={40} />
								<AdaptiveText style={[styles.rowLeft, { marginLeft: 8 }]}>{utils.formatScheduleDateTimeLabel(schedule.scheduleDateTime)}</AdaptiveText>
							</View>
							{/* <TouchableOpacity onPress={() => setShowScheduleContainer(true)}>
								<Icon name="create-outline" size={18} color={colors.blue} />
							</TouchableOpacity> */}
						</View>
					</View>
				</View>

				{/* Date & time row */}
				{/* <View style={styles.row}> 
					<Icon name="time-outline" color="black" size={20} />
					<AdaptiveText style={styles.rowLeft}>{utils.formatScheduleDateTimeLabel(schedule.scheduleDateTime)}</AdaptiveText>
					 <TouchableOpacity onPress={() => setShowScheduleContainer(true)}>
						<AdaptiveText style={styles.link}>Change</AdaptiveText>
					</TouchableOpacity> 
				</View> */}

			

			{/* From/To addresses */}
			<AddressContainer directions={schedule.stops || []} bg={colors.white} />

				{/* Payment method */}
				<View style={[styles.row, { justifyContent: 'space-between' }]}>
					<AdaptiveText style={styles.rowLeft}>Payment Method</AdaptiveText>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
						<AdaptiveText style={styles.pillText}>{(schedule.paymentMethod || 'CASH').charAt(0) + (schedule.paymentMethod || 'CASH').slice(1).toLowerCase()}</AdaptiveText>
						<Icon name="chevron-forward" size={18} color={colors.grey_xxdark} />
					</View>
				</View>

				{/* Cancel booking */}
				<TouchableOpacity 
					style={styles.cancelBtn}
					onPress={() => setShowCancelBottomSheet(true)}
				>
					<AdaptiveText style={styles.cancelText}>Cancel Booking</AdaptiveText>
				</TouchableOpacity>

				<TouchableOpacity 
					style={styles.backBtn}
					onPress={onBackPress}
				>
					<AdaptiveText style={styles.backText}>{fromBookScreen ? 'Go to Home' : 'Go Back'}</AdaptiveText>
				</TouchableOpacity>
			</BottomSheetWrapper>

			{showScheduleContainer && (
				<AnimatedBottomSheetWrapper onClose={oncloseDateTime}>
					<ScheduleContainer
						isUpdate={Boolean(scheduleDateTime?.date)}
						scheduleTime={scheduleDateTime?.time || new Date()}
						scheduleDate={scheduleDateTime?.date ? new Date(scheduleDateTime.date).toISOString().split('T')[0] : utils.getCurrentDate()}
						oncloseDateTime={oncloseDateTime}
						onConfirmDateTime={onConfirmDateTime}
					/>
				</AnimatedBottomSheetWrapper>
			)}
			{showCancelBottomSheet && (
				<AnimatedBottomSheetWrapper onClose={() => setShowCancelBottomSheet(false)}>
					<CancelComponent 
						onClose={() => setShowCancelBottomSheet(false)} 
						onCancel={handleCancel}
						loading={false}
						cancelLoading={cancelLoading}
						rideStatus={TripStatus.PENDING}
					/>
				</AnimatedBottomSheetWrapper>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	sheet: {
		
		backgroundColor: colors.white,
        paddingHorizontal:10
	},
    container: {
        flex: 1,
		
    },
	headerWrap: {
		alignItems: 'center',
		marginTop: 20,
	},
	calendarImg: { width: 64, height: 64 },
	headerTitle: {
		fontFamily: Fonts.semi_bold,
		fontSize: 16,
		color: colors.black,
		marginTop: 8,
		textAlign: 'center',
	},
	headerSub: {
		fontFamily: Fonts.light,
		fontSize: 12,
		color: colors.grey_xxdark,
		marginTop: 4,
		textAlign: 'center',
	},
	dashedDivider: {
		marginTop: 10,
		borderTopWidth: 1,
		borderStyle: 'dashed',
		borderColor: colors.grey_light,
	},
	successBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: colors.white,
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.grey_light,
		marginTop: 6,
	},
	successIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.green_xlight,
	},
	successTextWrap: { flex: 1 },
	successTitle: {
		fontFamily: Fonts.semi_bold,
		fontSize: 14,
		color: colors.black,
	},
	successSub: {
		fontFamily: Fonts.light,
		fontSize: 12,
		color: colors.grey_xxdark,
	},
		estimateBlock: {
			marginTop: 12,
			alignItems: 'center',
		},
		estimateTitle: {
			fontFamily: Fonts.regular,
			fontSize: 12,
			color: colors.grey_xxdark,
		},
		estimatePrice: {
			fontFamily: Fonts.bold,
			fontSize: 24,
			color: colors.green,
			marginTop: 6,
		},
		timeDistancePill: {
			marginTop: 10,
			borderWidth: 1,
			borderColor: colors.grey_light,
			borderRadius: 18,
			paddingHorizontal: 12,
			paddingVertical: 6,
			backgroundColor: colors.white,
		},
		timeDistanceText: {
			fontFamily: Fonts.semi_bold,
			fontSize: 13,
			color: colors.black,
		},
		cardsRow: { flexDirection: 'row', marginTop: 12 },
		tileCard: {
			flex: 1,
			padding: 12,
			borderRadius: 12,
			borderWidth: 1,
			borderColor: colors.grey_light,
			backgroundColor: colors.white,
			justifyContent: 'center',
			alignItems: 'center',
		},
	vehicleImg: { width: 80, height: 60, marginRight: 10 },
	vehicleMeta: { flex: 1, alignItems: 'flex-end' },
	vehicleName: { fontFamily: Fonts.semi_bold, fontSize: 14, color: colors.blue_xxdark },
		vehicleSeats: { fontFamily: Fonts.regular, fontSize: 12, color: colors.grey_xxdark, marginLeft: 6 },
	row: {
		marginTop: 12,
		paddingVertical: 14,
		paddingHorizontal: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.grey_light,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	rowLeft: { fontFamily: Fonts.semi_bold, fontSize: 14, color: colors.black },
	link: { fontFamily: Fonts.semi_bold, fontSize: 13, color: colors.blue },
	addrCard: {
		marginTop: 12,
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.grey_light,
		gap: 10,
	},
	addrRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	addrTextWrap: { flex: 1 },
	addrTitle: { fontFamily: Fonts.semi_bold, fontSize: 14, color: colors.black },
	addrSub: { fontFamily: Fonts.regular, fontSize: 12, color: colors.grey_xxdark },
	addrDivider: { height: 1, backgroundColor: colors.grey_light, marginVertical: 6 },
	rowRightPill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		backgroundColor: colors.white_dirt,
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 16,
	},
	pillText: { fontFamily: Fonts.semi_bold, fontSize: 12, color: colors.black },
	cancelBtn: {
		marginTop: 16,
		backgroundColor: colors.cance_red,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	backBtn: {
		marginTop: 10,
		backgroundColor: colors.grey_xdark,
		borderRadius: 12,
		paddingVertical: 14,
		alignItems: 'center',
	},
	backText: { fontFamily: Fonts.semi_bold, fontSize: 15, color: colors.black },
	cancelText: { fontFamily: Fonts.semi_bold, fontSize: 15, color: colors.white },
});

export default ScheduleScreen;

ScheduleScreen.propTypes = {
	trip: PropTypes.object,
	fromBookScreen: PropTypes.bool,
};

