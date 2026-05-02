import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import useUserStore from '../../store/useUserStore';
import { DateTimeFormatter } from '../../utils/DateTimeFormatter';
import APIRequest from '../../APIRequest';
import { Fonts } from '../../constants/constants';
import { useTranslation } from 'react-i18next';


const TripSelectionScreen = ({ onTripSelect, onCancel }) => {
  const tripSelectCallback = onTripSelect;
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const {userInfo} = useUserStore();
  const {t} = useTranslation()

  const fetchTrips = async (page = 1, isRefresh = false) => {
   const dates =  DateTimeFormatter.getThisMonthStartEndTime();

    const startDate = dates?.[0];
    const endDate = dates?.[1];
    try {
      setLoading(true);
      const api = new APIRequest()
      const response = await api.request(
        `/publicrides/driver/v2/getTrips?page=${page}&limit=${10}&tripStatus=${'ALL'}&startTime=${startDate}&endTime=${endDate}`, 
        'POST', 
        {}, 
        userInfo?.token
      );
      if (response.success) {
        if (isRefresh) {
          setTrips(response.trips);
        } else {
          setTrips(prev => [...prev, ...response.trips]);
        }
        setTotalPages(response.pagination.totalPages);
        setCurrentPage(response.pagination.page);
        setHasMoreData(response.pagination.page < response.pagination.totalPages);
      } else {
        Alert.alert('Error', 'Failed to load trips');
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrips(1, true);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrips(1, true);
  };

  const loadMoreTrips = () => {
    if (hasMoreData && !loading) {
      fetchTrips(currentPage + 1);
    }
  };

  const handleTripSelect = (trip) => {
    tripSelectCallback(trip);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${day}/${month}/${year} - ${displayHours}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'matched':
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'failed':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'matched':
        return 'Matched';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'failed':
        return 'Failed';
      default:
        return status || 'Unknown';
    }
  };

  const renderTripItem = ({ item }) => {
    const startAddress = item.stops?.[0]?.address || 'Unknown location';
    const endAddress = item.stops?.[item.stops.length - 1]?.address || 'Unknown location';
    const driverName = item.driverInfo?.driverName || 'No driver assigned';
    const vehicleNumber = item.driverInfo?.vehicleNumber || 'N/A';
    const fare = item.estimatedFare || item.minFare || 0;

    return (
      <TouchableOpacity
        style={styles.tripCard}
        onPress={() => handleTripSelect(item)}
      >
        <View style={styles.tripHeader}>
          <View style={styles.tripInfo}>
            <Text style={styles.tripDate}>{formatDate(item.bookingTime)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#6B7280" />
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot}>
              <View style={styles.pickupDot} />
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {startAddress}
            </Text>
          </View>
          
          <View style={styles.routeLine} />
          
          <View style={styles.locationRow}>
            <View style={styles.locationDot}>
              <View style={styles.dropoffDot} />
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {endAddress}
            </Text>
          </View>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="car" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.vehicleType}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="person" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{driverName}</Text>
          </View>
          
          <View style={styles.detailRow}>
           
            <Text style={styles.detailText}>₹ {fare}</Text>
          </View>
          
          {vehicleNumber !== 'N/A' && (
            <View style={styles.detailRow}>
              <Ionicons name="car-sport" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{vehicleNumber}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!hasMoreData) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{t('no_more_trips_to_load')}</Text>
        </View>
      );
    }
    
    if (loading) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color="#000000" />
          <Text style={styles.footerText}>{t('loading_your_recent_trips')}</Text>
        </View>
      );
    }
    
    return null;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="car-outline" size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>{t('no_trips_found')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('you_dont_have_any_trips_in_your_history_yet')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onCancel()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('select_trip')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Trip List */}
      <FlatList
        data={trips}
        renderItem={renderTripItem}
        keyExtractor={(item) => item._id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000000']}
            tintColor="#000000"
          />
        }
        onEndReached={loadMoreTrips}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading overlay for initial load */}
      {loading && trips.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>{t('loading_trips')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semi_bold,
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tripInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripDate: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  routeContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  dropoffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#374151',
    flex: 1,
  },
  tripDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#6B7280',
  },
  footerContainer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.semi_bold,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#6B7280',
    marginTop: 12,
  },
});

export default TripSelectionScreen; 