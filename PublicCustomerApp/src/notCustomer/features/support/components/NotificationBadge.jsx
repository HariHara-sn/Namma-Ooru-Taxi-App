import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const NotificationBadge = ({ count, size = 'medium', animated = true }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (animated && count > 0) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [count]);

  if (count === 0) return null;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 16, height: 16, borderRadius: 8 },
          text: { fontSize: 8 },
          icon: 8,
        };
      case 'large':
        return {
          container: { width: 24, height: 24, borderRadius: 12 },
          text: { fontSize: 12 },
          icon: 12,
        };
      default:
        return {
          container: { width: 20, height: 20, borderRadius: 10 },
          text: { fontSize: 10 },
          icon: 10,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {count > 99 ? (
        <Text style={[styles.text, sizeStyles.text]}>99+</Text>
      ) : (
        <Text style={[styles.text, sizeStyles.text]}>{count}</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 1,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default NotificationBadge; 