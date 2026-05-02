import { StatusBar, Text, View } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { SplashStyles } from '../../notCustomer/styles/SplashStyles';
import LottieView from 'lottie-react-native';
import DeviceInfo from 'react-native-device-info';

const bottomAnimation = require('../../notCustomer/assets/lottie/not.json');
const SplashScreen = () => {

  const version = DeviceInfo.getVersion();
  const versionCode = DeviceInfo.getBuildNumber();

  const animationRef = useRef(null);

  useEffect(() => {
    animationRef.current?.play();
  }, []);

  

  return (
    <View style={SplashStyles.screen}>
      <StatusBar backgroundColor={'#01041D'} barStyle="light-content" />

      <View style={SplashStyles.content}>
        <LottieView
          ref={animationRef}
          source={bottomAnimation}
          autoPlay
          loop
          style={SplashStyles.bottomAnimation}
        />
      </View>

      <View style={SplashStyles.splashBg}>
        <Text style={SplashStyles.splashTitle}>
          Namma Ooru Taxi
        </Text>
        <Text style={SplashStyles.versionTxt}>
          {`V ${version} ( ${versionCode} )`}
        </Text>
      </View>
    </View>
  );
};

export default SplashScreen;
