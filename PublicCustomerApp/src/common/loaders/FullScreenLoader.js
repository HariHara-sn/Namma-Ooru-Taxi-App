/* eslint-disable react-native/no-inline-styles */
import React, {Component} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {Colors} from '../constants/constants';

class FullScreenLoader extends Component {
  render() {
    const {message, showBG = true, size = 50} = this.props;

    return (
      <View
        style={[
          styles.container,
          {backgroundColor: showBG ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0)'},
        ]}>
        {/* <LoaderKit
          style={{width: 50, height: 50}}
          name={'TriangleSkewSpin'} // Optional: see list of animations below
          size={size}
          color={Colors.bright_orange}
        /> */}
        <ActivityIndicator size="large" color={Colors.periwinkle} />
        <Text style={styles.message}>{message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 450,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default FullScreenLoader;
