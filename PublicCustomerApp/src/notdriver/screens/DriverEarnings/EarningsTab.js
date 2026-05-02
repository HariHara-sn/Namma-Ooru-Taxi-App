import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl, Animated } from 'react-native'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import useUserStore from '../../../common/store/useUserStore'
import usePublicDriverStore from '../../store/usePublicDriverStore'
import { DateTimeFormatter } from '../../../common/utils/DateTimeFormatter'
import APIRequest from '../../../common/APIRequest'
import publicrideDriverApi from '../../api/publicrideDriverApi'
import FullScreenLoader from '../../../common/loaders/FullScreenLoader'
import PayDue from './PayDue'
import { Colors, Fonts } from '../../../common/constants/constants'
import { useTranslation } from 'react-i18next'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'

const AnimatedNumber = ({ value, prefix = '', suffix = '', style, decimals = 2 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: value || 0,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [value]);

  useEffect(() => {
    const id = animatedValue.addListener(({ value: v }) => {
      setDisplay(`${prefix}${v.toFixed(decimals)}${suffix}`);
    });
    return () => animatedValue.removeListener(id);
  }, [prefix, suffix, decimals]);

  return <Text style={style}>{display}</Text>;
};

const StatCard = ({ icon, iconColor, bgColor, label, value, prefix, suffix, loading: isLoading, onPress, decimals = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
    >
      <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.statIconWrap, { backgroundColor: bgColor }]}>
          {icon}
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color={iconColor} style={{ marginTop: 8 }} />
        ) : (
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} style={[styles.statValue, { color: iconColor }]} decimals={decimals} />
        )}
        <Text style={styles.statLabel}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};


const EarningsTab = () => {
  const {t} = useTranslation()
    const {userInfo} = useUserStore()
   const {driverDue, driverEarnings, driverDueDate, setdriverDueDate, driverInfo, setDriverDue, dueDuration} = usePublicDriverStore()
   const [payments, setPayments] = useState([])
   const [loading, setLoading] = useState(false)
   const [totalEarnings, setTotalEarnings] = useState(0)
   const [startDate, endDate] = DateTimeFormatter.getThisMonthStartEndTime()
   const [totalOnlineHours, setTotalOnlineHours] = useState(0)
   const [totalTrips, setTotalTrips] = useState(0)
   const [clearedAmount, setClearedAmount] = useState(0)
   const [pendingAmount, setPendingAmount] = useState(0)
   const [refreshing, setRefreshing] = useState(false)
   
   // Separate loading states for each section
   const [paymentsLoading, setPaymentsLoading] = useState(false)
   const [workingHoursLoading, setWorkingHoursLoading] = useState(false)

   const fetchDueDate = async () => {
    setLoading(true);
    try {
      const response = await publicrideDriverApi.getDriverDetails(userInfo?.token)
      if (response.success) {
        setdriverDueDate(response?.driver?.nextDueDate)
        setDriverDue(0);
      }
    } catch (error) {
      console.log('hari-->>error-->>', error)
    } finally {
      setLoading(false);
    }
 }

   const fetchPayments = async (pageNum = 1) => {
    if (!dueDuration) return
    try {
      setPaymentsLoading(true);
      const api = new APIRequest();  
      const response = await api.request(
        `/publicrides/payments/driver/get-Payments?page=${pageNum}&limit=${0}&tripStatus=${'all'}&startTime=${dueDuration.startTime}&endTime=${dueDuration.endTime}`, 
        'GET', 
        {},
        userInfo?.token
      );
      if (response.success) {
        const newPayments = response?.payments || [];
        setPayments(newPayments)
        setTotalEarnings(response?.totalEarnings)
        setClearedAmount(response?.clearedDue)
        setPendingAmount(response?.pendingDue)
        setTotalTrips(response?.count)
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setPaymentsLoading(false);
    }
  }

  const getTotalOnlineHours = async () => { 
    try {
      setWorkingHoursLoading(true);
      const api = new APIRequest();
      const response = await api.request(`/publicrides/driver/v2/getDriverWrkHistory`, 'GET', {}, userInfo?.token)
      if(response.success) {
        const wrkHistory = response?.wrkHistory[0]?.workingHours || []
        const filteredHours = wrkHistory.find((item)=>item.month === DateTimeFormatter.requiredDateFormat(startDate, 'YYYY-MM'))
        setTotalOnlineHours(filteredHours)
      }
    } catch (error) {
      console.error('Error fetching working hours:', error);
    } finally {
      setWorkingHoursLoading(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchPayments(), getTotalOnlineHours()]).finally(() => setRefreshing(false));
  }, [dueDuration]);

  useEffect(()=>{
    fetchPayments()
    getTotalOnlineHours()
  },[dueDuration])

  return (
    <View style={styles.screen}>
      {loading && <FullScreenLoader />}
       <PayDue driverDue={driverDue} userInfo={userInfo} driverDueDate={driverDueDate} fetchDueDate={fetchDueDate} driverInfo={driverInfo}/>
       {dueDuration?.endTime ? (
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.periwinkle]} tintColor={Colors.periwinkle} />}
          >

      {/* Date Range Chip */}
      <View style={styles.dateChip}>
        <MaterialIcons name="date-range" size={16} color={Colors.periwinkle} />
        <Text style={styles.dateRange}>
          {DateTimeFormatter.requiredDateFormat(dueDuration?.startTime, 'D MMM, YYYY')}
          {dueDuration?.endTime ? '  —  ' + DateTimeFormatter.requiredDateFormat(dueDuration?.endTime, 'D MMM, YYYY') : ''}
        </Text>
      </View>

      {/* Stat Cards Row */}
      <View style={styles.statsRow}>
        <StatCard
          icon={<Ionicons name="car-sport" size={20} color="#fff" />}
          iconColor="#f79559"
          bgColor="#f79559"
          label={t('total_trips')}
          value={totalTrips}
          loading={paymentsLoading}
        />
          <StatCard
          icon={<FontAwesome5 name="coins" size={20} color="#fff" />}
          iconColor="#5cf759"
          bgColor="#5cf759"
          label={t('total_earnings')}
          value={totalEarnings}
          loading={paymentsLoading}
        />
      </View>

    </ScrollView>
       ) : (<View />)}
    
    </View>
  )
}

export default EarningsTab

const styles = StyleSheet.create({
        screen: {
            flex: 1,
            backgroundColor: Colors.white,
          },
          container: {
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 100,
          },
          /* Date chip */
          dateChip: {
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'center',
            backgroundColor: Colors.periwinkle_light,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
            gap: 6,
            marginBottom: 16,
          },
          dateRange: {
            fontSize: 13,
            color: Colors.periwinkle,
            fontFamily: Fonts.medium,
          },
          /* Earnings hero */
          earningsHero: {
            alignItems: 'center',
            marginBottom: 20,
          },
          totalEarningsLabel: {
            fontSize: 14,
            color: Colors.warm_grey,
            fontFamily: Fonts.regular,
            marginBottom: 4,
          },
          totalEarnings: {
            fontSize: 36,
            color: Colors.green_online,
            fontFamily: Fonts.semi_bold,
          },
          /* Stat cards */
          statsRow: {
            flexDirection: 'row',
            gap: 12,
            marginBottom: 20,
            alignSelf: 'center',
          },
          statCard: {
            flex: 1,
            backgroundColor: Colors.white,
            borderRadius: 14,
            padding: 14,
            alignItems: 'center',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
          },
          statIconWrap: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          },
          statValue: {
            fontSize: 22,
            fontFamily: Fonts.semi_bold,
            marginTop: 8,
          },
          statLabel: {
            fontSize: 12,
            color: Colors.warm_grey,
            fontFamily: Fonts.regular,
            marginTop: 2,
            textAlign: 'center',
          },

})