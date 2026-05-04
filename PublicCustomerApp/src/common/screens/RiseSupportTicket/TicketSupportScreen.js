import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { FlatList } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { TextInput } from 'react-native'
import Config from 'react-native-config'
import useUserStore from '../../store/useUserStore'
import { useStackScreenStore } from '../../store/useStackScreenStore'
import useSupportStore from '../../store/useSupportStore'
import APIRequest from '../../APIRequest'
import NavBar from '../../components/NavBar'
import UseBackButton from '../../hooks/UseBackButton'
import { Colors, colors, Fonts } from '../../constants/constants'
import SkeletonLoader from '../../loaders/SkeletonLoader'
import CreateTicketForm from '../../components/CreateTicketForm'
import SupportCard from '../../components/SupportCard'
import { useTranslation } from 'react-i18next'



const TicketSupportScreen = () => {
  const {userInfo} = useUserStore()
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const {t} = useTranslation()
  
  const {stackScreen, setStackScreen, goBack} = useStackScreenStore()

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
    loadMoreTickets,
    hasMoreTickets,
    isLoadingMore,
    resetPagination,
    tabCounts,
    fetchTabCounts,
  } = useSupportStore();

  useEffect(() => {
    loadTickets();
    fetchTabCounts(userInfo?.token); // Fetch tab counts on mount
  }, []);

  // Load tickets when activeTab changes
  useEffect(() => {
    if (activeTab) {
      loadTickets();
    }
  }, [activeTab]);

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

  const handleRefresh = async () => {
    try {
      resetPagination(); // Reset pagination when refreshing
      await refreshTickets(userInfo?.token, { status: activeTab });
      await fetchTabCounts(userInfo?.token); // Refresh tab counts
    } catch (error) {
      console.error('Failed to refresh tickets:', error);
    }
  };

  const loadTickets = async () => {
    try {
      resetPagination(); // Reset pagination when loading new tickets
      await fetchTickets(userInfo?.token, activeTab);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const handleLoadMore = async () => {
    if (hasMoreTickets && !isLoadingMore) {
      try {
        await loadMoreTickets(userInfo?.token, activeTab);
      } catch (error) {
        console.error('Failed to load more tickets:', error);
      }
    }
  };

  const handleCreateTicket = async (ticketData) => {
    try {
      const payLoad={
        "title": ticketData.subject,
        "description": ticketData.description,
        "categoryId": ticketData.category,
        "tripId": ticketData.selectedTrip?._id
      }
      const api = new APIRequest(Config.SUPPORT_SYSTEM_URL)
      const response = await api.request('/api/driver-tickets', 'POST', payLoad, userInfo?.token);
      if(response?.success){
        setShowCreateForm(false);
        loadTickets();
        await fetchTabCounts(userInfo?.token); // Refresh tab counts after creating ticket
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create ticket. Please try again.');
    }
  };

  const handleTicketPress = async(ticket) => {
    try {
      const getTicketDetails = await fetchTicketDetails(ticket.ticketId, userInfo?.token);
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
        useSupportStore.getState().setSelectedTicket(updatedTicket);
        setStackScreen('TicketDetailScreen');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to get ticket details. Please try again.');
    }
  };

  const getStatusCount = (status) => {
    return tabCounts[status] || 0;
  };

  const renderTabButton = (tab, label, count) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {t(`${tab}`)}
      </Text>
      <View style={[styles.countBadge, activeTab === tab && styles.activeCountBadge]}>
        <Text style={[styles.countText, activeTab === tab && styles.activeCountText]}>
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

  if (showCreateForm) {
    return (
      <CreateTicketForm
        onSubmit={handleCreateTicket}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  return (
    <View style={styles.Screen}>
      <NavBar title={t('support_ticket')} onBackPress={() => goBack()}/>
        <UseBackButton onBackPress={() => goBack()}/>
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
          {searchQuery?.length > 0 && (
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
            <Text style={styles.notificationText}>{unreadCount}</Text>
          </View>
        )}
      
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTabButton('all', 'All', getStatusCount('all'))}
          {renderTabButton('open', 'Open', getStatusCount('open'))}
          {renderTabButton('in_progress', 'In Progress', getStatusCount('in_progress'))}
          {renderTabButton('resolved', 'Resolved', getStatusCount('resolved'))}
          {renderTabButton('closed', 'Closed', getStatusCount('closed'))}
          {renderTabButton('escalated', 'Escalated', getStatusCount('escalated'))}
        </ScrollView>
      </View>

             {/* Content */}
       <View style={styles.content}>
         {isLoading ? (
           <SkeletonLoader />
         ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : filteredTickets?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{t('no_tickets_found')}</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? t('try_adjusting_your_search_terms') : t('create_your_first_support_ticket')}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => setShowCreateForm(true)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.createFirstButtonText}>{t('create_ticket')}</Text>
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
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => {
            if (isLoadingMore) {
              return (
                <View style={styles.loadingMoreContainer}>
                  <Text style={styles.loadingMoreText}>{t('loading_more_tickets')}</Text>
                </View>
              );
            }
            if (!hasMoreTickets && filteredTickets?.length > 0) {
              return (
                <View style={styles.noMoreContainer}>
                  <Text style={styles.noMoreText}>{t('no_more_tickets_to_load')}</Text>
                </View>
              );
            }
            return null;
          }}
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
  )
}

export default TicketSupportScreen

const styles = StyleSheet.create({
  Screen:{
    flex:1,
    backgroundColor:Colors.white,
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
   loadingMoreContainer: {
     paddingVertical: 20,
     alignItems: 'center',
   },
   loadingMoreText: {
     fontSize: 14,
     fontFamily: Fonts.regular,
     color: '#6B7280',
   },
   noMoreContainer: {
     paddingVertical: 20,
     alignItems: 'center',
   },
   noMoreText: {
     fontSize: 14,
     fontFamily: Fonts.regular,
     color: '#9CA3AF',
   },
 });

