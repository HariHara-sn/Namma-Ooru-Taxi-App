import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const SIZE = 200;
const STROKE_WIDTH = 10;
const RADIUS_STEP = 15;

const CIRCLE_DATA = [
  { key: 'trips', color: '#4A90E2' },
  { key: 'distance', color: '#F5A623' },
  { key: 'duration', color: '#9B51E0' },
  { key: 'earnings', color: '#27AE60' },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HistoryGraph = ({ stats, maxStats }) => {
  // Animated values for each circle
  const animatedValues = useRef(
    CIRCLE_DATA.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Animate each circle to its new progress
    CIRCLE_DATA.forEach((item, index) => {
      const value = stats[item.key] || 0;
      const max = maxStats[item.key] || 1;
      const progress = value / max > 1 ? 1 : value / max;

      Animated.timing(animatedValues[index], {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    });
  }, [stats, maxStats]);

  return (
    <View style={{ alignItems: 'center', marginVertical: 30 }}>
      <Svg height={SIZE} width={SIZE}>
        {CIRCLE_DATA.map((item, index) => {
          const radius = SIZE / 2 - index * RADIUS_STEP - STROKE_WIDTH;
          const circumference = 2 * Math.PI * radius;

          const strokeDashoffset = animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [circumference, 0],
          });

          return (
            <React.Fragment key={item.key}>
              {/* Static Grey Background */}
              <Circle
                stroke="#E0E0E0"
                fill="none"
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={radius}
                strokeWidth={STROKE_WIDTH}
              />
              {/* Animated Progress */}
              <AnimatedCircle
                stroke={item.color}
                fill="none"
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={radius}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${SIZE / 2}, ${SIZE / 2}`}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={{ marginTop: 20 }}>
        {/* {CIRCLE_DATA.map((item) => (
          <Text key={item.key} style={styles.statText}>
            {item.key.toUpperCase()}: {stats[item.key]} / {maxStats[item.key]}
          </Text>
        ))} */}
      </View>
    </View>
  );
};

export default HistoryGraph;
