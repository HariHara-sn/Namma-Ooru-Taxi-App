import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Fonts } from '../constants/constants';

const ChatMessage = ({ message, isUser = false }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.agentContainer]}>
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.agentBubble]}>
        {!isUser && (
          <View style={styles.agentHeader}>
            <View style={styles.agentAvatar}>
              <Ionicons name="person" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.agentName}>Support Agent</Text>
          </View>
        )}
        
        <Text style={[styles.messageText, isUser ? styles.userText : styles.agentText]}>
          {message.content}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
          {isUser && (
            <View style={styles.statusContainer}>
              {message.status === 'sent' && (
                <Ionicons name="checkmark" size={12} color="#6B7280" />
              )}
              {message.status === 'delivered' && (
                <Ionicons name="checkmark-done" size={12} color="#6B7280" />
              )}
              {message.status === 'read' && (
                <Ionicons name="checkmark-done" size={12} color="#3B82F6" />
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  agentContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  agentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  agentName: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#6B7280',
  },
  messageText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  agentText: {
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: '#9CA3AF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
});

export default ChatMessage; 