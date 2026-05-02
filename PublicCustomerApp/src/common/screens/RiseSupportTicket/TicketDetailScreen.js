import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Config from 'react-native-config';
import useUserStore from '../../store/useUserStore';
import useSupportStore from '../../store/useSupportStore';
import { useStackScreenStore } from '../../store/useStackScreenStore';
import APIRequest from '../../APIRequest';
import ChatMessage from '../../components/ChatMessage';
import UseBackButton from '../../hooks/UseBackButton';
import { Fonts } from '../../constants/constants';


const TicketDetailScreen = () => {
  const {userInfo} = useUserStore()
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const {
    selectedTicket,
    isLoading,
    addMessageAsync,
    markMessagesAsRead,
    simulateAgentResponse,
    showPriority,
  } = useSupportStore();

  const { setStackScreen, goBack } = useStackScreenStore();

  useEffect(() => {
    if (selectedTicket?.ticketId) {
      markMessagesAsRead(selectedTicket.ticketId);
    }
  }, [selectedTicket?.ticketId]);

  useEffect(() => {
    if (flatListRef.current && selectedTicket?.messages?.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [selectedTicket?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedTicket) return;

    const messageText = message.trim();
    setMessage('');
    setIsTyping(true);
    console.log('messageText',messageText, selectedTicket);
    try {
      await addMessage(selectedTicket.ticketId, messageText);
     
    } catch (error) {
      console.log('error',error);
      setIsTyping(false);
    }
  };

  const addMessage = async (ticketId, messageText) => {
    const api = new APIRequest(Config.SUPPORT_SYSTEM_URL)
    const formData = new FormData();
    formData.append('comment', messageText);
    const response = await api.request(`/api/driver-tickets/${ticketId}/comments`, 'POST', formData, userInfo?.token);
    console.log('response',response);
    if (response?.success) {
      setMessage('');
      setIsTyping(false);
      await addMessageAsync(selectedTicket.ticketId, messageText, userInfo._id);
    }
  };

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!selectedTicket) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Ticket not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStackScreen('SupportScreen')}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!selectedTicket) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Ticket not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStackScreen('SupportScreen')}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const SystemMessage = ({ message }) => {
    return (
      <View style={styles.systemMessageContainer}>
        {/* <AdaptiveText style={styles.systemMessageText} color="white">{message?.content}</AdaptiveText> */}
        <Text style={styles.systemMessageText}>{message?.content}</Text>
      </View>
    );
  };

  const renderMessage = ({ item }) => (
    
    item?.sender == "system" ?
    <SystemMessage message={item} isUser={false} />
    :
    <ChatMessage message={item} isUser={item?.sender == userInfo?._id} />
  );

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
          <Text style={styles.typingText}>Agent is typing...</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <UseBackButton onBackPress={() => goBack()} />
      {/* Header */}
      <View style={styles.header}>
                 <TouchableOpacity
           style={styles.backButton}
           onPress={() => goBack()}
         >
           <Ionicons name="chevron-back" size={24} color="#000000" />
         </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.ticketId}>#{selectedTicket.ticketId}</Text>
          <Text style={styles.subject} numberOfLines={1}>
            {selectedTicket.subject}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTicket.status) }]}>
            <Text style={styles.statusText}>{getStatusText(selectedTicket.status)}</Text>
          </View>
        </View>
      </View>

      {/* Ticket Info */}
      <View style={styles.ticketInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Category:</Text>
          <Text style={styles.infoValue}>{selectedTicket.category}</Text>
        </View>
                 {showPriority && (
           <View style={styles.infoRow}>
             <Text style={styles.infoLabel}>Priority:</Text>
             <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTicket.priority) }]}>
               <Text style={styles.priorityText}>{selectedTicket.priority}</Text>
             </View>
           </View>
         )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created:</Text>
          <Text style={styles.infoValue}>{formatDate(selectedTicket.createdAt)}</Text>
        </View>
      </View>

             {/* Messages */}
       <View style={styles.messagesContainer}>
                   {isLoading ? (
            <View style={styles.messagesSkeleton}>
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={[
                  styles.messageSkeleton,
                  item % 2 === 0 ? styles.userMessageSkeleton : styles.agentMessageSkeleton
                ]}>
                  {item % 2 === 0 ? (
                    // User message skeleton (right side)
                    <View style={styles.userSkeletonContent}>
                      <View style={styles.skeletonUserMessageText} />
                      <View style={styles.skeletonUserMessageTextShort} />
                      <View style={styles.skeletonUserTimestamp} />
                    </View>
                  ) : (
                    // Agent message skeleton (left side)
                    <View style={styles.agentSkeletonContent}>
                      <View style={styles.skeletonMessageHeader}>
                        <View style={styles.skeletonAvatar} />
                        <View style={styles.skeletonAgentName} />
                      </View>
                      <View style={styles.skeletonMessageText} />
                      <View style={styles.skeletonMessageTextShort} />
                      <View style={styles.skeletonTimestamp} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
           <FlatList
             ref={flatListRef}
             data={selectedTicket.messages}
             renderItem={renderMessage}
             keyExtractor={(item) => item.id}
             showsVerticalScrollIndicator={false}
             contentContainerStyle={styles.messagesList}
             ListFooterComponent={renderTypingIndicator}
           />
         )}
       </View>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!message.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() ? '#FFFFFF' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  ticketId: {
    fontSize: 16,
    fontFamily: Fonts.semi_bold,
    color: '#1F2937',
  },
  subject: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#6B7280',
    marginTop: 2,
  },
  statusContainer: {
    marginLeft: 12,
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
  ticketInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#6B7280',
    width: 80,
  },
  infoValue: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#374151',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: Fonts.semi_bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
  },
  typingContainer: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginRight: 4,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  typingText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#6B7280',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 8,
  },
     sendButton: {
     backgroundColor: '#000000',
     width: 32,
     height: 32,
     borderRadius: 16,
     justifyContent: 'center',
     alignItems: 'center',
     marginLeft: 8,
   },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
  },
    
     backButtonText: {
     color: '#FFFFFF',
     fontSize: 14,
     fontFamily: Fonts.semi_bold,
   },
       // Skeleton styles for chat messages
    messagesSkeleton: {
      paddingVertical: 16,
    },
    messageSkeleton: {
      marginVertical: 8,
      paddingHorizontal: 16,
      maxWidth: '80%',
    },
    // Agent message skeleton (left side)
    agentMessageSkeleton: {
      alignSelf: 'flex-start',
    },
    agentSkeletonContent: {
      maxWidth: '80%',
    },
    skeletonMessageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    skeletonAvatar: {
      width: 24,
      height: 24,
      backgroundColor: '#E5E7EB',
      borderRadius: 12,
      marginRight: 8,
    },
    skeletonAgentName: {
      width: 80,
      height: 11,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
    },
    skeletonMessageText: {
      width: '100%',
      height: 14,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
      marginBottom: 4,
    },
    skeletonMessageTextShort: {
      width: '70%',
      height: 14,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
      marginBottom: 8,
    },
    skeletonTimestamp: {
      width: 50,
      height: 10,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
    },
    // User message skeleton (right side)
    userMessageSkeleton: {
      alignSelf: 'flex-end',
    },
    userSkeletonContent: {
      maxWidth: '80%',
      alignItems: 'flex-end',
    },
    skeletonUserMessageText: {
      width: '100%',
      height: 14,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
      marginBottom: 4,
    },
    skeletonUserMessageTextShort: {
      width: '60%',
      height: 14,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
      marginBottom: 8,
    },
    skeletonUserTimestamp: {
      width: 40,
      height: 10,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
      alignSelf: 'flex-end',
    },
    systemMessageContainer: {
      backgroundColor: '#F3F4F6',
      padding: 12,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      width: '100%',
      alignSelf: 'flex-start',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',  
      marginTop: 10,
    },
    systemMessageText: {
      fontSize: 12,
      fontFamily: Fonts.regular,
      color: 'white',
      textAlign: 'center',
      backgroundColor: 'grey',
      borderRadius: 5,
      padding: 5,
      paddingHorizontal: 7,
      width: '70%',
      
    },
 });

export default TicketDetailScreen; 