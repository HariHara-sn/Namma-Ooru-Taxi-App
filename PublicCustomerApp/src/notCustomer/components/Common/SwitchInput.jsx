import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';

const CustomSwitch = ({ 
  value, 
  onValueChange, 
  disabled = false,
  trackColor = { false: "#d1d5db", true: "#003988" },
  thumbColor = "#fff",
  width = 36,      // smaller width
  height = 20      // smaller height
}) => {
  // Calculate thumb size and positions
  const thumbSize = height - 4;
  const offPosition = 2;
  // Corrected: When enabled, thumb should be flush right (width - thumbSize - 2)
  const onPosition = width - thumbSize - 2;

  const translateX = React.useRef(new Animated.Value(value ? onPosition : offPosition)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? onPosition : offPosition,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, width, height, onPosition, offPosition]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: value ? trackColor.true : trackColor.false,
          opacity: disabled ? 0.5 : 1,
        }
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            backgroundColor: thumbColor,
            transform: [{ translateX }],
            position: 'absolute',
            left: 0,
            top: 2,
          }
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    justifyContent: 'center',
    padding: 2,
    overflow: 'visible', // Allow thumb to overflow when enabled
  },
  thumb: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 2,
  },
});

export default CustomSwitch;