import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import PropTypes from 'prop-types';
import { colors } from '../../../constants/constants';

const HorizontalLoadingIndicator = ({ 
  width = '100%', 
  height = 20, // Increased height from 10 to 20
  backgroundColor = 'rgba(0, 0, 0, 0.1)',
  activeColor = '#007AFF',
  duration = 2000 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main sliding animation
    const slideAnimation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      })
    );

    // Pulse animation for the active bar
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    slideAnimation.start();
    pulseAnimation.start();

    return () => {
      animatedValue.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [animatedValue, pulseAnim, duration]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  return (
    <View style={[styles.container, { width, height, backgroundColor }]}>
      {/* Background shimmer effect */}
      <Animated.View
        style={[
          styles.shimmerBackground,
          {
            opacity: animatedValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.1, 0.3, 0.1],
            }),
            transform: [{ translateX }],
          },
        ]}
      />
      
      {/* Main active bar */}
      <Animated.View
        style={[
          styles.activeBar,
          {
            backgroundColor: activeColor,
            opacity,
            transform: [
              { translateX },
              { scaleX: scale },
            ],
          },
        ]}
      />
      
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowEffect,
          {
            backgroundColor: activeColor,
            opacity: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
            transform: [
              { translateX },
              { scaleX: scale },
            ],
          },
        ]}
      />
    </View>
  );
};

HorizontalLoadingIndicator.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.number,
  backgroundColor: PropTypes.string,
  activeColor: PropTypes.string,
  duration: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    width: '40%',
    height: '100%',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  shimmerBackground: {
    position: 'absolute',
    width: '60%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  glowEffect: {
    position: 'absolute',
    width: '40%',
    height: '100%',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HorizontalLoadingIndicator; 