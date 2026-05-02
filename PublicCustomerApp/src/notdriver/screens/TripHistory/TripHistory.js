import { StyleSheet, Text, View } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import useUserStore from '../../../common/store/useUserStore'
import APIRequest from '../../../common/APIRequest'
import HistoryHeader from './HistoryHeader'
import TripHistoryList from './TripHistoryList'
import { Colors, Fonts } from '../../../common/constants/constants'
import { useTranslation } from 'react-i18next'

const TripHistory = () => {
  const { t } = useTranslation()
  const [tripData, setTripData] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [tripStatus, setTripStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalTrips, setTotalTrips] = useState(0);
  const [startDate, setStartDate] = useState(new Date().setHours(0, 0, 0, 0));
  const [endDate, setEndDate] = useState(new Date().setHours(23, 59, 59, 999));
  const {userInfo} = useUserStore();

  const onDateRangeSelect = (dateRange) => {
    if (dateRange && dateRange.dateRange && dateRange.dateRange.length === 2) {
      setStartDate(dateRange.dateRange[0]);
      setEndDate(dateRange.dateRange[1]);
    }
  }

  const fetchTrips = async (pageNum = 1, isRefresh = false) => {
    try {
      setLoading(true);
      const api = new APIRequest();  
      const response = await api.request(
        `/publicrides/driver/v2/getTrips?page=${pageNum}&limit=${limit}&tripStatus=${tripStatus}&startTime=${startDate}&endTime=${endDate}`, 
        'POST', 
        {}, 
        userInfo?.token
      );
      if (response.success) {
        const newTrips = response.trips || [];
        if (isRefresh) {
          setTripData(newTrips);
        } else {
          setTripData(prev => [...prev, ...newTrips]);
        }
        
        setTotalTrips(response.total || 0);
        setHasMoreData(newTrips.length === limit);
        // Only update page if this is not a refresh operation or if it's the first page
        if (!isRefresh || pageNum === 1) {
          setPage(pageNum);
        }
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMoreData(true);
    fetchTrips(1, true);
  }

  const loadMoreTrips = () => {
    if (!loading && hasMoreData) {
      fetchTrips(page + 1);
    }
  }

  const handleTripStatusChange = (status) => {
    // setTripData([]);
    // setHasMoreData(true);
    // Reset loading and refreshing states to prevent conflicts
    setLoading(false);
    setRefreshing(false);
    setTripStatus(status);
    setPage(1);
  }

  // Reset to today's date when component mounts
  useEffect(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
    
    setStartDate(startOfDay);
    setEndDate(endOfDay);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      setPage(1);
      setTripData([]);
      setHasMoreData(true);
      fetchTrips(1, true);
    }
  }, [tripStatus, startDate, endDate]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{t('trip_history')}</Text>
      </View>
      <HistoryHeader
        onDateRangeSelect={onDateRangeSelect} 
        onTripStatusChange={handleTripStatusChange}
      />
      <TripHistoryList
        trips={tripData}
        loading={loading}
        refreshing={refreshing}
        hasMoreData={hasMoreData}
        onRefresh={onRefresh}
        onLoadMore={loadMoreTrips}
        tripStatus={tripStatus}
        totalTrips={totalTrips}
      />
    </View>
  )
}

export default TripHistory

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:Colors.white,
  },
  headerContainer:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    paddingHorizontal:10,
    borderBottomWidth:1,
    borderBottomColor:Colors.grey,
    width:'90%',
    alignSelf:'center',
    paddingVertical:20
  },
  headerTitle:{
    fontSize:20,
    color:Colors.black,
    fontFamily:Fonts.medium,
    textAlign:'center',
  }
})