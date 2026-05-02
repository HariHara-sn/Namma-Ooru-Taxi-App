import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import PropTypes from 'prop-types';
import { colors } from '../../constants/constants';

const ScrollHintChevron = ({ direction = 'down', size = 18, color = colors.black, style }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const offset = direction === 'down' ? 6 : -6;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: offset,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      translateY.stopAnimation();
    };
  }, [direction, translateY]);

  const iconName = direction === 'down' ? 'chevron-down' : 'chevron-up';

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <FontAwesome5 name={iconName} size={size} color={color} />
      </Animated.View>
    </View>
  );
};

ScrollHintChevron.propTypes = {
  direction: PropTypes.oneOf(['down', 'up']),
  size: PropTypes.number,
  color: PropTypes.string,
  style: PropTypes.any,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});

export default ScrollHintChevron; 