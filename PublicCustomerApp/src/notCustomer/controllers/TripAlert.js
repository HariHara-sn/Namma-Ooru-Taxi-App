/* eslint-disable class-methods-use-this */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-console */


import { NativeModules, Platform } from "react-native";

const { PlaySoundModule } = Platform.OS === "android" ? NativeModules : {};

class TripAlert {
  constructor() {
  }

  playAlertSound() {
    if (Platform.OS === "android" && PlaySoundModule && PlaySoundModule.playAlertSound) {
      console.log('Playing alert sound using native method');
      return PlaySoundModule.playAlertSound();
    } else {
      console.log('playAlertSound is only available on Android');
      return Promise.resolve();
    }
  }

  stopAlertSound() {
    if (Platform.OS === "android" && PlaySoundModule && PlaySoundModule.stopAlertSound) {
      return PlaySoundModule.stopAlertSound();
    } else {
      console.log('stopAlertSound is only available on Android');
      return Promise.resolve();
    }
  }
}

const tripAlert = new TripAlert();
export default tripAlert;
