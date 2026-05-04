import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import useUserStore from '../../../common/store/useUserStore';
import useDriverStatusStore from '../../store/useDriverStatusStore';
import APIRequest from '../../../common/APIRequest';
import UseBackButton from '../../../common/hooks/UseBackButton';
import NavBar from '../../../common/components/NavBar';
import { Colors, colors, Fonts } from '../../../common/constants/constants';
import { DateTimeFormatter } from '../../../common/utils/DateTimeFormatter';


const PublicRidesPriceChart = () => {
  const {goBack, setStackScreen} = useStackScreenStore();
  const {userInfo} = useUserStore()
  const [fareDetails, setFareDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const {setSelectedFare} = useDriverStatusStore();

  const onBackPress = () => {
    goBack();
  };

  const getFareDetails = async () => {
    setIsLoading(true);
    setError('');
    const api = new APIRequest();
    try {
      const response = await api.request(
        '/publicrides/driver/v2/getFareConfigs',
        'GET',
        {},
        userInfo.token,
      );
      if (response?.success) {
        setFareDetails(response.data);
      } else {
        setFareDetails(null);
        setError('Failed to load fare configurations');
      }
    } catch (e) {
      setFareDetails(null);
      setError('Network error while loading fares');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getFareDetails();
  }, []);

  const numeric = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const applySurge = (base, sVal, sType) => {
    const baseNum = numeric(base);
    const sNum = numeric(sVal);
    const t = String(sType || '').toLowerCase();
    switch (t) {
      case 'multiplier':
        return baseNum * sNum;
      case 'fixed':
        return baseNum + sNum;
      case 'percentage':
        return baseNum * (1 + sNum / 100);
      default:
        return baseNum;
    }
  };

  const formatSurgeLabel = (surge) => {
    const t = String(surge?.type || '').toLowerCase();
    const v = surge?.value;
    if (t === 'multiplier') return `x${v}`;
    if (t === 'fixed') return `+${v}`;
    if (t === 'percentage') return `+${v}%`;
    return '';
  };

  const calculateFinalPrice = (fareTypeKey, vehicleConfig, surgeValue, surgeType, fromTime, toTime) => {
    try {
      setIsNavigating(true);
      const ranges = Array.isArray(vehicleConfig?.rangePricing)
        ? vehicleConfig.rangePricing
        : [];

      const surgedRanges = ranges.map((r) => ({
        ...r,
        value: applySurge(r?.value, surgeValue, surgeType),
      }));

      const updatedConfig = {
        vehicle: fareTypeKey,
        rangePricing: surgedRanges,
fromTime:DateTimeFormatter.format12Hour(fromTime),
toTime:DateTimeFormatter.format12Hour(toTime),
      };

      setSelectedFare(updatedConfig);
      setStackScreen('PriceChartDetails');
    } finally {
      // Component likely unmounts immediately after navigation; this is a fallback.
      setTimeout(() => setIsNavigating(false), 500);
    }
  };

  const vehicleEntries = useMemo(() => Object.entries(fareDetails?.vehicleTypes || {}), [fareDetails]);

  return (
    <View style={styles.screenContainer}>
      <UseBackButton onBackPress={() => onBackPress()} />
      <NavBar title={'Price Chart'} onBackPress={() => onBackPress()} />
      {isLoading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={Colors.primary || '#2563EB'} />
          <Text style={styles.loaderText}>Loading fares…</Text>
        </View>
      ) : (
      <ScrollView>
        {vehicleEntries.map(([key, value]) => (
          <View
            key={key}
            style={styles.card}
            >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{key?.replace("_", " ")}</Text>
            </View>
            {fareDetails?.surge?.enabled ? (
              <>
                {fareDetails?.surge?.multipliers?.map((surge, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.surgeItem}
                    onPress={()=> calculateFinalPrice(key, value, surge.value, surge.type, surge?.timeRange?.start, surge?.timeRange?.end)}>
                    <View style={styles.surgeRow}>
                      <Text style={styles.surgeTime}>From {DateTimeFormatter.format12Hour(surge?.timeRange?.start)} to {DateTimeFormatter.format12Hour(surge?.timeRange?.end)}</Text>
                    </View>
                    <Text style={styles.surgeDays}>
                      {Array.isArray(surge?.days) ? surge.days.join(', ') : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <></>
            )}
          </View>
        ))}
      </ScrollView>
      )}
      {(isNavigating) && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={Colors.primary || '#2563EB'} />
          <Text style={styles.loaderText}>Opening details…</Text>
        </View>
      )}
    </View>
  );
};

export default PublicRidesPriceChart;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E1E4E8',
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    color: '#111827',
    fontFamily:Fonts.semi_bold
  },
  baseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  baseBtnText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  surgeItem: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    backgroundColor: '#FAFBFC',
  },
  surgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  surgeTime: {
    color: '#111827',
    fontSize: 14,
    fontFamily:Fonts.medium
  },
  surgeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#EEF2FF',
  },
  surgeBadgeText: {
    color: '#4338CA',
    fontSize: 12,
    fontWeight: '700',
  },
  surgeDays: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 12,
    fontFamily:Fonts.regular
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 8,
    color: '#374151',
    fontSize: 12,
  },
});



