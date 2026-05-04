import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useContext, use } from 'react'
import useUserStore from '../../../common/store/useUserStore'
import APIRequest from '../../../common/APIRequest'
import { DateTimeFormatter } from '../../../common/utils/DateTimeFormatter'
import { Colors, colors, Fonts } from '../../../common/constants/constants'
import HistoryHeader from '../TripHistory/HistoryHeader'
import { height } from '../../../common/utils/scalingutils'
import { useTranslation } from 'react-i18next'



const TransactionTab = () => {
  const { t } = useTranslation();
  const { userInfo } = useUserStore()
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [clearedDue, setClearedDue] = useState(0);
  const [pendingDue, setPendingDue] = useState(0);

  const formatAmount = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const formatDistance = (distance) => {
    if (!distance) return '0km';
    return `${distance}km`;
  };

  const formatDuration = (duration) => {
    if (!duration) return '0min';
    return `${duration}min`;
  };

  const fetchReports = async (page = 1, isRefresh = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      }
      
      const api = new APIRequest();
      const limit = 10;
     
      const response = await api.request(
          `/publicrides/payments/driver/getTransactionHistory?page=${page}&limit=${limit}&startTime=${startDate}&endTime=${endDate}`, 
        'GET',
        {},
        userInfo?.token
      );
            
      if (response.success) {
        const newtransactions = response.transactions || [];
        
        if (page === 1 || isRefresh) {
          setTransactions(newtransactions);
        } else {
          setTransactions(prev => [...prev, ...newtransactions]);
        }
        
        setTotalEarnings(response.totalEarnings || 0);
        setClearedDue(response.clearedDue || 0);
        setPendingDue(response.pendingDue || 0);
        
        // Check if there's more data
        const pagination = response.pagination;
        if (pagination) {
          setHasMoreData(page < pagination.totalPages);
        } else {
          setHasMoreData(newtransactions.length === limit);
        }
        
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreData(true);
    fetchReports(1, true);
  };

  const onLoadMore = () => {
    if (!loading && hasMoreData) {
      fetchReports(currentPage + 1);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const onDateRangeSelect = (dateRange) => {
    const [startDate, endDate] = dateRange.dateRange;
    setStartDate(startDate);
    setEndDate(endDate);
    // setCurrentPage(1);
    // setHasMoreData(true);
  };

  const renderPaymentItem = ({ item, index }) => (
    <View style={styles.paymentItem}>

      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTimeText}>
            {DateTimeFormatter.requiredDateFormat(item.createdAt, 'ddd MMM DD, YYYY')} | {DateTimeFormatter.requiredDateFormat(item.createdAt, 'hh:mm A')}
          </Text>
          <Text style={styles.tripIdText}>
          Order ID: {item.orderId}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Payment Details */}
      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('amount')}</Text>
          <Text style={[styles.detailValue, { color: Colors.green }]}>
            {formatAmount(item.amount / 100)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('currency')}</Text>
          <Text style={[styles.detailValue, { color: Colors.orange }]}>
            {item.currency}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('payment_id')}</Text>
          <Text style={styles.detailValue}>
            {item.paymentId || 'N/A'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('receipt')}</Text>
          <Text style={styles.detailValue}>
            {item.receipt || 'N/A'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>VPA</Text>
          <Text style={styles.detailValue}>
            {item.vpa || 'N/A'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('email')}</Text>
          <Text style={styles.detailValue}>
            {item.email || 'N/A'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('contact')}</Text>
          <Text style={styles.detailValue}>
            {item.contact || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Colors.periwinkle} />
        <Text style={styles.loadingText}>{t('loading_more_transactions')}</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('no_transactions_found')}</Text>
      <Text style={styles.emptySubText}>
        {t('you_havent_made_any_transactions_yet_for_the_selected_date_range')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <HistoryHeader isEarnings={true} onDateRangeSelect={onDateRangeSelect} />      
      <FlatList
        data={transactions}
        renderItem={renderPaymentItem}
        keyExtractor={(item, index) => item._id?.toString() || index.toString()}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default TransactionTab

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingBottom:height * 0.1
  },
  summaryContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.grey_xxdark,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: Fonts.semi_bold,
    color: Colors.black,
  },
  list: {
  },
  listContent: {
    paddingBottom: 20,
  },
  paymentItem: {
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
  statusContainer: {
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    paddingVertical: 4,
  },
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
    fontFamily: Fonts.medium,
  },
  tripIdText: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: 'monospace',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 14,
    color: Colors.black,
    fontFamily: Fonts.regular,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  paymentDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.grey_xxdark,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: Fonts.semi_bold,
    color: Colors.black,
  },
  viewDetailBtn: {
    backgroundColor: Colors.periwinkle,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailBtnText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: Fonts.medium,
  },
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
    fontFamily: Fonts.regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.black,
    marginBottom: 8,
    fontFamily: Fonts.medium,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.grey_xxdark,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
})

