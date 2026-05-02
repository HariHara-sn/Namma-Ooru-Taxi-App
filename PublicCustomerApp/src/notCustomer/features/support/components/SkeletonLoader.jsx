import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const SkeletonLoader = () => {
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
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Animated.View style={[styles.skeletonTicketId, { opacity }]} />
              <Animated.View style={[styles.skeletonPriorityBadge, { opacity }]} />
            </View>
            <Animated.View style={[styles.skeletonStatusBadge, { opacity }]} />
          </View>
          
          {/* Subject */}
          <Animated.View style={[styles.skeletonSubject, { opacity }]} />
          
          {/* Description */}
          <Animated.View style={[styles.skeletonDescription, { opacity }]} />
          <Animated.View style={[styles.skeletonDescriptionShort, { opacity }]} />
          
          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.metaInfo}>
              <Animated.View style={[styles.skeletonIcon, { opacity }]} />
              <Animated.View style={[styles.skeletonMetaText, { opacity }]} />
            </View>
            <View style={styles.metaInfo}>
              <Animated.View style={[styles.skeletonIcon, { opacity }]} />
              <Animated.View style={[styles.skeletonMetaText, { opacity }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  skeletonTicketId: {
    width: 80,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 8,
  },
  skeletonPriorityBadge: {
    width: 50,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  skeletonStatusBadge: {
    width: 60,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  skeletonSubject: {
    width: '90%',
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonDescription: {
    width: '100%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonDescriptionShort: {
    width: '70%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
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
  skeletonIcon: {
    width: 14,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 7,
  },
  skeletonMetaText: {
    width: 60,
    height: 11,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginLeft: 4,
  },
});

export default SkeletonLoader; 