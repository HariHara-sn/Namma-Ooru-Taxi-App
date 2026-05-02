import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Svg, {Path} from 'react-native-svg';
import { Fonts } from '../../common/constants/constants';


export default function WayPointIndicator(props) {
  const {waypoints} = props;

  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16">
      <Path
        d="M10.485,0A2,2,0,0,1,11.9.586L15.414,4.1A2,2,0,0,1,16,5.515v4.971a2,2,0,0,1-.586,1.414L11.9,15.414A2,2,0,0,1,10.485,16H5.515A2,2,0,0,1,4.1,15.414L.586,11.9A2,2,0,0,1,0,10.485V5.515A2,2,0,0,1,.586,4.1L4.1.586A2,2,0,0,1,5.515,0Z"
        fill="#1379ff"
      />
      <Text
        style={{
          color: 'white',
          alignSelf: 'center',
          fontSize: 10,
          fontFamily: Fonts.light,
        }}>
        {waypoints}
      </Text>
    </Svg>
  );
}
