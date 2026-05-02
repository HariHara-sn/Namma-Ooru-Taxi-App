import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SupportCard from '../components/SupportCard';
import CreateTicketForm from '../components/CreateTicketForm';
import SkeletonLoader from '../../../components/Loaders/SkeletonLoader';
import useSupportStore from '../store/useSupportStore';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import { Fonts } from '../../../constants/constants';
import UserTicketService from '../services/UserTicketService';
import AdaptiveText from '../../../components/Common/AdaptiveText';

const SupportScreen = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filteredTickets, setFilteredTickets] = useState([]);

  const {
    tickets,
    isLoading,
    error,
    unreadCount,
    calculateUnreadCount,
    searchTickets,
    getTicketsByStatus,
    showPriority,
    setShowPriority,
    fetchTickets,
    refreshTickets,
    fetchTicketDetails,
  } = useSupportStore();

  const { setStackScreen, reset } = useStackScreenStore();

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    calculateUnreadCount();
  }, [tickets]);

  useEffect(() => {
    let filtered = [];
    
    if (searchQuery.trim()) {
      filtered = searchTickets(searchQuery);
    } else if (activeTab === 'all') {
      filtered = tickets;
    } else {
      filtered = getTicketsByStatus(activeTab);
    }
    
    setFilteredTickets(filtered);
  }, [searchQuery, activeTab, tickets]);

  const loadTickets = async () => {
    try {
      const params = {};
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      await fetchTickets();
    } catch (error) {
      console.error(t('failed_to_load_tickets'), error);
    }
  };

  const handleRefresh = async () => {
    try {
      const params = {};
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      await refreshTickets(params);
    } catch (error) {
      console.error(t('failed_to_refresh_tickets'), error);
    }
  };

  const handleCreateTicket = async (ticketData) => {
    console.log('ticketData',ticketData);
    try {
      const payLoad={
        "title": ticketData.subject,
        "description": ticketData.description,
        "categoryId": ticketData.category,
        "tripId": ticketData.selectedTrip?._id
      }
      
      const response = await UserTicketService.createTicket(payLoad);
      if(response?.success){
        Alert.alert(t('success'), t('ticket_created_successfully'));
        setShowCreateForm(false);
        loadTickets();
      }
      // console.log('response',response);
      // if(response?.data){
      //   Alert.alert('Success', 'Ticket created successfully!');
      //   setShowCreateForm(false);
      // }
      // await createTicket(ticketData);
      // setShowCreateForm(false);
      // Alert.alert('Success', 'Ticket created successfully!');
      
      // // Navigate to ticket detail
      // setStackScreen('TicketDetailScreen');
    } catch (error) {
      Alert.alert(t('error'), error.message || t('failed_to_create_ticket'));
    }
  };

  const handleTicketPress = async (ticket) => {
   
    const getTicketDetails = await UserTicketService.getTicketDetails(ticket.ticketId);
    if(getTicketDetails?.data?.comments){
      const transFormData = getTicketDetails?.data?.comments?.map(item => ({
        "id": item._id,
        "content": item.comment,
        "sender":item?.addedBy?.userId,
        "timestamp": item.createdAt,
        "status": "read",
      }));
      const updatedTicket = {
        ...ticket,
        messages: transFormData,
      };
      console.log('updatedTicket',updatedTicket);
      useSupportStore.getState().setSelectedTicket(updatedTicket);
      setStackScreen('TicketDetailScreen');
    }
    // console.log('getTicketDetails',JSON.stringify(getTicketDetails?.data?.comments));
    // if (getTicketDetails) {
    //   useSupportStore.getState().setSelectedTicket(getTicketDetails);
    //   setStackScreen('TicketDetailScreen');
    // }
  };

  const getStatusCount = (status) => {
    if (status === 'all') return tickets?.length;
    return getTicketsByStatus(status)?.length;
  };

  const renderTabButton = (tab, label, count) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text 
        style={[styles.tabText, activeTab === tab && styles.activeTabText]}
        color={activeTab === tab ? "#FFFFFF" : "#6B7280"}
        
      >
        {label}
      </Text>
      <View style={[styles.countBadge, activeTab === tab && styles.activeCountBadge]}>
        <Text 
          style={[styles.countText, activeTab === tab && styles.activeCountText]}
          color={activeTab === tab ? "#000000" : "#6B7280"}
          font
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTicket = ({ item }) => (
    <SupportCard
      ticket={item}
      onPress={handleTicketPress}
    />
  );

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <SkeletonLoader width="60%" height={16} />
            <SkeletonLoader width={60} height={20} />
          </View>
          <SkeletonLoader width="90%" height={14} />
          <SkeletonLoader width="70%" height={12} />
          <View style={styles.skeletonFooter}>
            <SkeletonLoader width={80} height={20} />
            <SkeletonLoader width={60} height={12} />
          </View>
        </View>
      ))}
    </View>
  );

  if (showCreateForm) {
    return (
      <CreateTicketForm
        onSubmit={handleCreateTicket}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => reset()}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <AdaptiveText style={styles.headerTitle} color="#1F2937">{t('support')}</AdaptiveText>
                     <View style={styles.headerActions}>
             <View
               style={styles.priorityToggle}
               onPress={() => setShowPriority(!showPriority)}
             >
               {/* <Ionicons 
                 name={showPriority ? "flag" : "flag-outline"} 
                 size={20} 
                 color={showPriority ? "#000000" : "#6B7280"} 
               /> */}
             </View>
           </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_tickets')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Ionicons name="notifications" size={16} color="#FFFFFF" />
            <AdaptiveText style={styles.notificationText} color="#FFFFFF">{unreadCount}</AdaptiveText>
          </View>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTabButton('all', t('all'), getStatusCount('all'))}
          {renderTabButton('open', t('open'), getStatusCount('open'))}
          {renderTabButton('in_progress', t('in_progress'), getStatusCount('in_progress'))}
          {renderTabButton('resolved', t('resolved'), getStatusCount('resolved'))}
          {renderTabButton('closed', t('closed'), getStatusCount('closed'))}
        </ScrollView>
      </View>

             {/* Content */}
       <View style={styles.content}>
         {isLoading ? (
           renderSkeletonLoader()
         ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <AdaptiveText style={styles.errorText} color="#EF4444">{error}</AdaptiveText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadTickets}
            >
              <AdaptiveText style={styles.retryButtonText} color="#FFFFFF">{t('retry')}</AdaptiveText>
            </TouchableOpacity>
          </View>
        ) : filteredTickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
            <AdaptiveText style={styles.emptyTitle} color="#374151">{t('no_tickets_found')}</AdaptiveText>
            <AdaptiveText style={styles.emptySubtitle} color="#6B7280">
              {searchQuery ? t('try_adjusting_search') : t('create_first_support_ticket')}
            </AdaptiveText>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => setShowCreateForm(true)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <AdaptiveText style={styles.createFirstButtonText} color="#FFFFFF">{t('create_ticket')}</AdaptiveText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredTickets}
            renderItem={renderTicket}
            keyExtractor={(item) => item.ticketId}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshing={isLoading}
            onRefresh={handleRefresh}
          />
                 )}
       </View>
       
       {/* Floating Action Button */}
       <TouchableOpacity
         style={styles.fab}
         onPress={() => setShowCreateForm(true)}
       >
         <Ionicons name="add" size={24} color="#FFFFFF" />
       </TouchableOpacity>
     </View>
   );
 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityToggle: {
    padding: 4,
    width:"10%"
  },
  createButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#1F2937',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 20,
    justifyContent: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Fonts.semi_bold,
    marginLeft: 2,
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingLeft: 20,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
     activeTabButton: {
     backgroundColor: '#000000',
   },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  activeCountBadge: {
    backgroundColor: '#FFFFFF',
  },
  countText: {
    fontSize: 10,
    fontFamily: Fonts.semi_bold,
    color: '#6B7280',
  },
     activeCountText: {
     color: '#000000',
   },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#6B7280',
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.semi_bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    marginBottom: 24,
  },
     createFirstButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: '#000000',
     paddingHorizontal: 16,
     paddingVertical: 12,
     borderRadius: 8,
   },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.semi_bold,
    marginLeft: 6,
  },
     listContainer: {
     padding: 20,
   },
   fab: {
     position: 'absolute',
     bottom: 20,
     right: 20,
     width: 56,
     height: 56,
     borderRadius: 28,
     backgroundColor: '#000000',
     justifyContent: 'center',
     alignItems: 'center',
     elevation: 8,
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 4,
     },
     shadowOpacity: 0.3,
     shadowRadius: 4.65,
   },
 });

export default SupportScreen; 