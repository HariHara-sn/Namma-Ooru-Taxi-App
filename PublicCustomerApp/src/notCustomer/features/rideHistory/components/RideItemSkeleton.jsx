import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { yourRidesStyles } from '../../../styles/YourRidesStyles';

const RideItemSkeleton = () => {
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
    <View style={yourRidesStyles.ridesContainerItem}>
      <View style={yourRidesStyles.ridesContainerItemLeft}>
        <View>
          <Animated.View style={[styles.skeletonTitle, { opacity }]} />
          <Animated.View style={[styles.skeletonDesc, { opacity }]} />
        </View>
        <Animated.View style={[styles.skeletonFare, { opacity }]} />
      </View>
      <View style={yourRidesStyles.ridesContainerItemRight}>
        <View style={styles.imagesRow}>
          {/* <Animated.View style={[styles.skeletonVehicleImg, { opacity }]} /> */}
          <Animated.View style={[styles.skeletonProfileImg, { opacity }]} />
        </View>
      
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonTitle: {
    width: '80%',
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonDesc: {
    width: '60%',
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonFare: {
    width: '40%',
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    
  },
  imagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  skeletonVehicleImg: {
    width: 70,
    height: 70,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    marginRight: -20,
    zIndex: 1,
  },
  skeletonProfileImg: {
    width: 60,
    height: 60,
    backgroundColor: '#E5E7EB',
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  textContainer: {
    alignItems: 'flex-end',
  },
  skeletonDriverName: {
    width: 80,
    height: 15,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonVehicleDesc: {
    width: 60,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
});

export default RideItemSkeleton; 