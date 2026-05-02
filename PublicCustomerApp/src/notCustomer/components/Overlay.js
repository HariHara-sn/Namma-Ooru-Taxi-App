import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import PropTypes from 'prop-types';

const Overlay = ({ 
  visible = false, 
  onPress, 
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  zIndex = 1000,
  children,
  onAnimationComplete
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onAnimationComplete) onAnimationComplete('in');
      });
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (onAnimationComplete) onAnimationComplete('out');
      });
    }
  }, [visible, fadeAnim, onAnimationComplete]);

  if (!visible && fadeAnim._value === 0) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          backgroundColor,
          zIndex,
          opacity: fadeAnim,
        }
      ]}
    >
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.touchableArea}>
          {children}
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchableArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

Overlay.propTypes = {
  visible: PropTypes.bool,
  onPress: PropTypes.func,
  backgroundColor: PropTypes.string,
  zIndex: PropTypes.number,
  children: PropTypes.node,
  onAnimationComplete: PropTypes.func,
};

export default Overlay; 