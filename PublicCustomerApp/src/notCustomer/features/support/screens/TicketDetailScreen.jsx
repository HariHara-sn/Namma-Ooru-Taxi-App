import React, { useState, useEffect, useRef } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ChatMessage from '../components/ChatMessage';
import useSupportStore from '../store/useSupportStore';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import { Fonts } from '../../../constants/constants';
import UserTicketService from '../services/UserTicketService';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import {utils} from '../../../utils/Utils'; 


const TicketDetailScreen = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [inputBarHeight, setInputBarHeight] = useState(56); // default guess
  const { userInfo,id } = useUserInfoStore();
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const {
    selectedTicket,
    isLoading,
    addMessageAsync,
    markMessagesAsRead,
    simulateAgentResponse,
    showPriority,
  } = useSupportStore();

  const { setStackScreen } = useStackScreenStore();


  const SystemMessage = ({ message }) => {
    return (
      <View style={styles.systemMessageContainer}>
        <AdaptiveText style={styles.systemMessageText} color="white">{message?.content}</AdaptiveText>
      </View>
    );
  };    

  useEffect(() => {
    if (selectedTicket?.ticketId) {
      markMessagesAsRead(selectedTicket.ticketId);
    }
  }, [selectedTicket?.ticketId]);


  const addMessage = async (ticketId, messageText) => {
    // Send as { message: ... } form data
   
    const response = await UserTicketService.addMessage(ticketId, messageText );
    if (response?.success) {
      setMessage('');
      setIsTyping(false);
      await addMessageAsync(selectedTicket.ticketId, messageText,id);
      
    }
  };

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

    try {
      await addMessage(selectedTicket.ticketId, messageText);

    } catch (error) {
      Alert.alert(t('error'), t('failed_to_send_message'));
      setIsTyping(false);
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
        return t('open');
      case 'in_progress':
        return t('in_progress');
      case 'resolved':
        return t('resolved');
      case 'closed':
        return t('closed');
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString(); 
    
    
    return `${day} / ${month} / ${year}`;
  };

  if (!selectedTicket) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <AdaptiveText style={styles.errorText} color="#EF4444">{t('ticket_not_found')}</AdaptiveText>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStackScreen('SupportScreen')}
        >
          <AdaptiveText style={styles.backButtonText} color="#FFFFFF">{t('go_back')}</AdaptiveText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!selectedTicket) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <AdaptiveText style={styles.errorText} color="#EF4444">{t('ticket_not_found')}</AdaptiveText>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStackScreen('SupportScreen')}
        >
          <AdaptiveText style={styles.backButtonText} color="#FFFFFF">{t('go_back')}</AdaptiveText>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMessage = ({ item }) => (
    
    item?.sender == "system" ?
    <SystemMessage message={item} isUser={false} />
    :
    <ChatMessage message={item} isUser={item?.sender == id} />
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
          <AdaptiveText style={styles.typingText} color="#6B7280">{t('agent_is_typing')}</AdaptiveText>
        </View>
      </View>
    );
  };

  const renderNoMessages = () => {
    return (
      <View style={styles.noMessagesContainer}>
        <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
        <AdaptiveText style={styles.noMessagesTitle} color="#374151">{t('no_messages_yet')}</AdaptiveText>
        <AdaptiveText style={styles.noMessagesSubtitle} color="#6B7280">
          {t('start_conversation_message')}
        </AdaptiveText>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
      {/* Header */}
      <View
        style={styles.header}
        onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}
      >
                 <TouchableOpacity
           style={styles.backButton}
           onPress={() => setStackScreen('SupportScreen')}
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
          <AdaptiveText style={styles.infoLabel} color="#6B7280">{t('category')}</AdaptiveText>
          <AdaptiveText style={styles.infoValue} color="#374151">{selectedTicket.category}</AdaptiveText>
        </View>
                 {showPriority && (
           <View style={styles.infoRow}>
             <AdaptiveText style={styles.infoLabel} color="#6B7280">{t('priority')}</AdaptiveText>
             <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTicket.priority) }]}>
               <AdaptiveText style={styles.priorityText} color="#FFFFFF">{selectedTicket.priority}</AdaptiveText>
             </View>
           </View>
         )}
           <View style={styles.infoRowDescription}>
          <AdaptiveText style={styles.infoLabel} color="#6B7280">{t('description')}</AdaptiveText>
          <AdaptiveText style={styles.infoValue} color="#374151">{ utils.cleanText(selectedTicket.description)}</AdaptiveText>
        </View>

        <View style={styles.infoRow}>
          <AdaptiveText style={styles.infoLabel} color="#6B7280">{t('created')}</AdaptiveText>
          <AdaptiveText style={styles.infoValue} color="#374151">{formatDate(selectedTicket.createdAt)}</AdaptiveText>
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
          ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
           <FlatList
             ref={flatListRef}
             data={selectedTicket.messages}
             renderItem={renderMessage}
             keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.messagesList,
              { paddingBottom: (inputBarHeight || 56) + 12 + insets.bottom }
            ]}
            keyboardShouldPersistTaps="handled"
             ListFooterComponent={renderTypingIndicator}
           />
         ) : (
           renderNoMessages()
         )}
       </View>

      {/* Message Input */}
      <View
        style={[styles.inputContainer, { paddingBottom: Math.max(16, 16 + insets.bottom) }]}
        onLayout={e => setInputBarHeight(e.nativeEvent.layout.height)}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder={t('type_your_message')}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
            placeholderTextColor="#9CA3AF"
            underlineColorAndroid="transparent"
            blurOnSubmit={false}
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
    </SafeAreaView>
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
  infoRowDescription: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 10,
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
    
    width: '80%',
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
    paddingVertical: 10,
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
    noMessagesContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 50,
      backgroundColor: '#F9FAFB',
    },
    noMessagesTitle: {
      fontSize: 18,
      fontFamily: Fonts.semi_bold,
      color: '#374151',
      marginTop: 16,
      textAlign: 'center',
    },
    noMessagesSubtitle: {
      fontSize: 14,
      fontFamily: Fonts.regular,
      color: '#6B7280',
      marginTop: 4,
      textAlign: 'center',
    },
 });

export default TicketDetailScreen; 