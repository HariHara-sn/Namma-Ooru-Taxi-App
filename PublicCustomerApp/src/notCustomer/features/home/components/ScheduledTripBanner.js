import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import useScheduleTripStore from '../../../store/useScheduleTripStore';
import { colors, Fonts } from '../../../constants/constants';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import LinearGradient from 'react-native-linear-gradient';
import { utils } from '../../../utils/Utils';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AUTO_IMG from '../../../assets/vehicle/AUTO.webp';
import BIKE_IMG from '../../../assets/vehicle/BIKE.webp';
import HATCHBACK_IMG from '../../../assets/vehicle/HATCHBACK.webp';
import SEDAN_IMG from '../../../assets/vehicle/SEDAN.webp';
import SUV_IMG from '../../../assets/vehicle/SUV.webp';
import EXSEDAN_IMG from '../../../assets/vehicle/ExSEDAN.webp';
import VehicleDriverPreview from '../../../components/Common/VehicleDriverPreview';
import ScheduleTimer from '../../../assets/image/scheduleTimer.webp';
const VEHICLE_IMAGES = {
  AUTO: AUTO_IMG,
  BIKE: BIKE_IMG,
  HATCHBACK: HATCHBACK_IMG,
  SEDAN: SEDAN_IMG,
  SUV: SUV_IMG,
  EXSEDAN: EXSEDAN_IMG,
};
const ScheduledTripBanner = () => {
  const { scheduledTrips } = useScheduleTripStore();
  const { setStackScreen } = useStackScreenStore();

  const trips = scheduledTrips || [];
  const handleViewAll = useCallback(() => {
    setStackScreen('MyRidesScreen', {setScreen:'upcoming'});
  }, [setStackScreen]);

  const primaryTrip = useMemo(() => {
    if (trips.length === 1) {
      return trips[0];
    }
    return null;
  }, [trips]);

  if (!trips.length) return null;

  if (primaryTrip) {
    const drop = (primaryTrip?.stops && primaryTrip.stops[primaryTrip.stops.length - 1]?.address) || 'Drop';
    const formattedWhen = primaryTrip?.scheduleDateTime 
      ? utils.formatScheduleDateTimeLabel(primaryTrip.scheduleDateTime)
      : 'Scheduled';

    const vehicleImg = VEHICLE_IMAGES[primaryTrip?.vehicleType] || AUTO_IMG;

    // driver photo may be in primaryTrip.driverData or primaryTrip.driver; it might be a local require or a remote URL string
    const driverPhoto = primaryTrip?.driverData?.driverPhoto || primaryTrip?.driver?.photo || null;

    // console.log("driverPhoto",driverPhoto)
    const DriverImageSource = driverPhoto
      ? (typeof driverPhoto === 'string' ? { uri: driverPhoto } : driverPhoto)
      : null;


    const vehicleType = primaryTrip?.vehicleType || 'AUTO';
    const isElectricVehicle = vehicleType == "ELECTRIC_AUTO" || vehicleType == "ELECTRIC_BIKE" || vehicleType == "ELECTRIC_HATCHBACK" || vehicleType == "ELECTRIC_SEDAN" || vehicleType == "ELECTRIC_SUV" || vehicleType == "ELECTRIC_EXSEDAN";

    const handleViewScheduledTrip = () => {
      setStackScreen('ScheduleScreen', {
        trip: primaryTrip,
      });
    };

    

    return (
    <TouchableOpacity onPress={handleViewScheduledTrip} >
      <LinearGradient colors={['#0f223c', '#0f223c']} style={styles.container}>
        <View style={styles.headerRow}>
          <AdaptiveText style={styles.title}>Scheduled trip</AdaptiveText>
         {driverPhoto && <AdaptiveText style={styles.rideId}>. Driver Assigned</AdaptiveText>}
        </View>

        <View style={styles.singleRow}>
          <VehicleDriverPreview
            vehicleType={vehicleType}
            driverPhoto={driverPhoto}
            isElectricVehicle={isElectricVehicle}
          />
          
          <View style={styles.textCol}>
            <Text style={styles.dropLabel}>Drop at</Text>
            <AdaptiveText numberOfLines={2} style={styles.addressText}>{drop}</AdaptiveText>
            {formattedWhen ? (
              <View style={styles.metaInline}>
                <Ionicons name="time-outline" size={14} color={'rgba(255,255,255,0.85)'} />
                <Text style={styles.metaText}>{formattedWhen}</Text>
              </View>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.white || '#ffffff'} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handleViewAll} >
    <LinearGradient colors={['#0f223c', '#0f223c']} style={styles.container}>
     
      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
        <View style={{flexDirection:'column', flex:1,gap:10,paddingLeft:5}}>
        <AdaptiveText style={styles.title}>Scheduled trips</AdaptiveText>
        <AdaptiveText style={styles.subtitle} numberOfLines={2}>
        You have {trips.length} upcoming scheduled trips
      </AdaptiveText>
        </View>
      
      <TouchableOpacity onPress={handleViewAll} style={{flexDirection:"row",gap:"5",justifyContent:"center",alignItems:"center"}} activeOpacity={0.8}>
        <Image source={ScheduleTimer} style={{width:50, height:50, marginRight:6}} />
        <Ionicons name="chevron-forward" size={20} color={colors.white || '#ffffff'} />
      </TouchableOpacity>
      </View>
    </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    backgroundColor: 'black',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  vehicleImg: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    transform: [{ scaleX: -1 }],
  },
  driverImgWrap: {
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 32,
    overflow: 'hidden',
    marginLeft: -10,
    marginRight: 8,
    backgroundColor: '#fff',
    zIndex: 2,
  },
  driverImg: {
    width: 60,
    height: 60,
    borderRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  title: {
    fontFamily: Fonts.semi_bold,
    fontSize: 14,
    color: colors.white || '#ffffff',
  },
  rideId: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#bcbcbcff',
  },
  singleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  textCol: {
    flex: 1,
  },

  dropLabel: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginTop: 4,
  },
  bulletDrop: {
    backgroundColor: '#f44336',
  },
  addressText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.white || '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  countBadge: {
    minWidth: 26,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.primary || '#4b48ab',
    color: colors.white || '#ffffff',
    borderRadius: 999,
    overflow: 'hidden',
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: colors.white_dirt,
    marginBottom: 8,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary || '#4b48ab',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  ctaText: {
    color: colors.white || '#ffffff',
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
});

export default ScheduledTripBanner;


