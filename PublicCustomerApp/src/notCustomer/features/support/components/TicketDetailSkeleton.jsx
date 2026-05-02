import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const TicketDetailSkeleton = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Animated.View style={[styles.skeletonBackButton, { opacity }]} />
        <View style={styles.headerInfo}>
          <Animated.View style={[styles.skeletonTicketId, { opacity }]} />
          <Animated.View style={[styles.skeletonSubject, { opacity }]} />
        </View>
        <Animated.View style={[styles.skeletonStatusBadge, { opacity }]} />
      </View>

      {/* Ticket Info Skeleton */}
      <View style={styles.ticketInfo}>
        <View style={styles.infoRow}>
          <Animated.View style={[styles.skeletonInfoLabel, { opacity }]} />
          <Animated.View style={[styles.skeletonInfoValue, { opacity }]} />
        </View>
        <View style={styles.infoRow}>
          <Animated.View style={[styles.skeletonInfoLabel, { opacity }]} />
          <Animated.View style={[styles.skeletonPriorityBadge, { opacity }]} />
        </View>
        <View style={styles.infoRow}>
          <Animated.View style={[styles.skeletonInfoLabel, { opacity }]} />
          <Animated.View style={[styles.skeletonInfoValue, { opacity }]} />
        </View>
      </View>

      {/* Messages Skeleton */}
      <View style={styles.messagesContainer}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.messageSkeleton}>
            <View style={styles.messageHeader}>
              <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
              <Animated.View style={[styles.skeletonAgentName, { opacity }]} />
            </View>
            <Animated.View style={[styles.skeletonMessageText, { opacity }]} />
            <Animated.View style={[styles.skeletonMessageTextShort, { opacity }]} />
            <View style={styles.messageFooter}>
              <Animated.View style={[styles.skeletonTimestamp, { opacity }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Input Skeleton */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Animated.View style={[styles.skeletonInput, { opacity }]} />
          <Animated.View style={[styles.skeletonSendButton, { opacity }]} />
        </View>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonBackButton: {
    width: 24,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  skeletonTicketId: {
    width: 100,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonSubject: {
    width: '80%',
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonStatusBadge: {
    width: 80,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
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
  skeletonInfoLabel: {
    width: 80,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 8,
  },
  skeletonInfoValue: {
    width: 120,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonPriorityBadge: {
    width: 60,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  messageSkeleton: {
    marginVertical: 8,
    paddingHorizontal: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  messageHeader: {
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
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonTimestamp: {
    width: 50,
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
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
  skeletonInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    marginRight: 8,
  },
  skeletonSendButton: {
    width: 32,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
  },
});

export default TicketDetailSkeleton; 