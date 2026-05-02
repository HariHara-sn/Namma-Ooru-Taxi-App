import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Fonts } from '../constants/constants';
import useSupportStore from '../store/useSupportStore';

const SupportCard = ({ ticket, onPress, showStatus = true }) => {
  const { showPriority } = useSupportStore();
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return '#10B981';
      case 'in_progress':
        return '#F59E0B';
      case 'resolved':
        return '#3B82F6';
      case 'closed':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(ticket)}>
      
      <View style={styles.header}>
        
        <View style={styles.titleContainer}>
          <Text style={styles.ticketId}>#{ticket.ticketId}</Text>
        </View>
        <View style={styles.statusContainer}>
      {showPriority && (
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
              <Text style={styles.priorityText}>{ticket.priority}</Text>
            </View>
          )}
       {showStatus && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.statusText}>{getStatusText(ticket.status)}</Text>
          </View>
        )}
      </View>
      </View>
    
     
      
      <Text style={styles.subject} numberOfLines={2}>
        {ticket.subject}
      </Text>
      
      <Text style={styles.description} numberOfLines={2}>
        {ticket.description}
      </Text>
      
      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{ticket.createdAt}</Text>
        </View>
        
        {ticket.lastMessage && (
          <View style={styles.metaInfo}>
            <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
            <Text style={styles.metaText}>{ticket.lastMessage}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticketId: {
    fontSize: 16,
    fontFamily: Fonts.semi_bold,
    color: '#1F2937',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: Fonts.semi_bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Fonts.semi_bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  subject: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#374151',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#6B7280',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    fontFamily: Fonts.regular,
    color: '#6B7280',
    marginLeft: 4,
  },
  statusContainer:{
    alignItems: 'center',
    gap: 10,
  }
});

export default SupportCard; 