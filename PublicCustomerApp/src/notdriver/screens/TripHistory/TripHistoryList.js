import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import AntDesign from 'react-native-vector-icons/AntDesign'
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import { useSelectedRouteStore } from '../../store/useTripsStore';
import { DateTimeFormatter } from '../../../common/utils/DateTimeFormatter';
import { Colors, colors, Fonts } from '../../../common/constants/constants';
import { useTranslation } from 'react-i18next';

const TripHistoryList = ({
  trips,
  loading,
  refreshing,
  onRefresh,
  onLoadMore,
  tripStatus,
}) => {
  const {t} = useTranslation();
  const {setStackScreen} = useStackScreenStore();
  const {setSelectedTrip} = useSelectedRouteStore();

  // Prevent footer flicker by keeping it visible for a minimum time
  const [showLoadMore, setShowLoadMore] = useState(false);
  const minDisplayTimerRef = useRef(null);
  const MIN_FOOTER_MS = 500; // adjust to preference

  useEffect(() => {
    if (loading) {
      // Show immediately when loading starts
      if (minDisplayTimerRef.current) {
        clearTimeout(minDisplayTimerRef.current);
        minDisplayTimerRef.current = null;
      }
      setShowLoadMore(true);
    } else {
      // Ensure footer stays at least MIN_FOOTER_MS to prevent flicker
      if (showLoadMore) {
        minDisplayTimerRef.current = setTimeout(() => {
          setShowLoadMore(false);
          minDisplayTimerRef.current = null;
        }, MIN_FOOTER_MS);
      }
    }
    return () => {
      if (minDisplayTimerRef.current) {
        clearTimeout(minDisplayTimerRef.current);
      }
    };
  }, [loading, showLoadMore]);

  // Debounce onEndReached triggers caused by momentum scrolling
  const canLoadMoreRef = useRef(true);
  const handleMomentumBegin = () => { canLoadMoreRef.current = true; };
  const handleEndReached = () => {
    if (!canLoadMoreRef.current) return;
    if (loading) return; // don't request while already loading
    canLoadMoreRef.current = false;
    onLoadMore && onLoadMore();
  };

  const formatDistance = (distance) => {
    if (!distance || distance < 0 || typeof distance === "object") return '0km';
    return `${parseFloat(distance).toFixed(2)}km`;
  };

  const formatDuration = (duration) => {
    if (!duration || duration < 0) return '0min';
    return `${duration}min`;
  };

  const formatAmount = (amount) => {
    if (!amount || amount < 0) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const renderTripItem = ({ item, index }) => (
    <View style={styles.tripItem} activeOpacity={0.7}>
        <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{item.status}</Text>
        </View>
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTimeText}>
            {DateTimeFormatter.requiredDateFormat(item.bookingTime, 'ddd MMM DD, YYYY')} | {DateTimeFormatter.requiredDateFormat(item.bookingTime, 'hh:mm A')}
          </Text>
          <Text style={styles.tripIdText}>
            {item._id}
          </Text>
        </View>
       
      </View>

      <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {formatDistance(item.finalDistance)} | {formatDuration(item?.finalDuration)} | {formatAmount(item?.paymentDetails?.fareDetails?.fare)}
          </Text>
        </View>
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Location Section */}
      <View style={styles.locationSection}>
        {/* Start Location */}
        <View style={styles.locationItem}>
          <View style={styles.locationIconContainer}>
            <View style={styles.startLocationIcon}>
              <View style={styles.startLocationDot} />
            </View>
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>{t('start_location')}</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {item?.stops[0]?.address || 'N/A'}
            </Text>
          </View>
        </View>
        
        {/* Connection Line */}
        <View style={styles.connectionLine} />
        
        {/* End Location */}
        <View style={styles.locationItem}>
          <View style={styles.locationIconContainer}>
            <AntDesign name="enviromento" size={20} color={Colors.red} />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>{t('end_location')}</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {item.stops[item.stops.length - 1].address || 'N/A'}
            </Text>
          </View>
        </View>
      </View>
      {item.status === 'CANCELLED' ? null : (
      <TouchableOpacity style={styles.viewDetailBtn} onPress={()=>{
        setStackScreen('TripDetailScreen')
        setSelectedTrip(item)
      }}>
        <Text style={styles.viewDetailBtnText}>{t('view_details')}</Text>
      </TouchableOpacity>
       ) }
    </View>
  );

  const renderFooter = () => {
    if (!showLoadMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.periwinkle} />
        <Text style={styles.loadingText}>{t('loading_more_trips')}</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('you_havent_completed_any_trips_yet')}</Text>
      <Text style={styles.emptySubText}>
        {tripStatus === 'ALL' 
          ? t('you_havent_completed_any_trips_yet')
          : `No ${tripStatus} trips found.`
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        renderItem={renderTripItem}
        keyExtractor={(item, index) => item.request_id?.toString() || index.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        onMomentumScrollBegin={handleMomentumBegin}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default TripHistoryList

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    // flex: 1,
    height:'60%',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  tripItem: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  // Top Section Styles
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateTimeText: {
    fontSize: 16,
    color: Colors.black,
    marginBottom: 4,
    fontFamily:Fonts.medium,
  },
  tripIdText: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'monospace',
  },
  statsContainer: {
    // alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 14,
    color: Colors.black,
    fontFamily:Fonts.regular,
    // textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  // Location Section Styles
  locationSection: {
    position: 'relative',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  startLocationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.skyBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.periwinkle,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: Colors.grey_xxdark,
    marginBottom: 2,
    fontFamily:Fonts.regular,
  },
  locationAddress: {
    fontSize: 14,
    color: Colors.black,
    lineHeight: 18,
    fontFamily:Fonts.regular,
  },
  connectionLine: {
    position: 'absolute',
    left: 11,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  // Navigation Arrow
  navigationArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  // Loading and Empty States
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.grey_xxdark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    width:'90%',
    alignSelf:'center',
  },
  emptyText: {
    fontSize: 18,
    color: Colors.black,
    marginBottom: 8,
    fontFamily:Fonts.medium,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.grey_xxdark,
    textAlign: 'center',
    fontFamily:Fonts.regular,
  },
  statusText: {
    fontSize: 16,
    color: Colors.periwinkle,
    fontFamily:Fonts.medium,
    paddingVertical:10
  },
  viewDetailBtn: {
    backgroundColor: Colors.periwinkle,
    padding: 10,
    borderRadius: 12,
    alignItems:'center',
    justifyContent:'center',
    marginTop:10
  },
  viewDetailBtnText: {
    fontSize: 14,
    color: Colors.white,    
    fontFamily:Fonts.medium,
  },
})

