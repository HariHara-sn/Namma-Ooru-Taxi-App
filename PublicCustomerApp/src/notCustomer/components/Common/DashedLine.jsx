import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import PropTypes from 'prop-types';

const DashedLine = ({
  color = '#bdbdbd',
  strokeWidth = 1,
  dashLength = 5,
  dashGap = 5,
  height = 1,
  width = 1,
  vertical = false,
  style,
}) => {
  // If vertical, line is from (width/2, 0) to (width/2, 100%)
  // If horizontal, line is from (0, height/2) to (100%, height/2)
  if (vertical) {
    return (
      <View style={[styles.verticalContainer, style]}>
        <Svg height="100%" width={strokeWidth}>
          <Line
            x1={strokeWidth / 2}
            y1="0"
            x2={strokeWidth / 2}
            y2="100%"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength}, ${dashGap}`}
          />
        </Svg>
      </View>
    );
  } else {
    return (
      <View style={[styles.horizontalContainer, { height }, style]}>
        <Svg height={height} width="100%">
          <Line
            x1="0"
            y1={height / 2}
            x2="100%"
            y2={height / 2}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength}, ${dashGap}`}
          />
        </Svg>
      </View>
    );
  }
};

DashedLine.propTypes = {
  color: PropTypes.string,
  strokeWidth: PropTypes.number,
  dashLength: PropTypes.number,
  dashGap: PropTypes.number,
  height: PropTypes.number,
  width: PropTypes.number,
  vertical: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  
  verticalContainer: {
   flex:1,
    alignItems: 'center',
  },
});

export default DashedLine;