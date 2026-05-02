/* eslint-disable class-methods-use-this */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-console */

import { NativeModules } from "react-native";

const { BGLocationServiceModule } = NativeModules;

class LocationBackgroundTask {
  constructor() {
    this.running = false
  }

  // startDriverLocationService
  // stopDriverLocationService

  async runDriverBgTask() {
    if (this.running) return
    this.running = true
    return BGLocationServiceModule.startDriverLocationService()
  }

  async stopDriverBgTask() {
    this.running = false
    // DataStore.clearSession()
    return BGLocationServiceModule.stopDriverLocationService()
  }

  async runBgTask() {
    console.log("Run bg task called",this.running)
    if (this.running) return
    this.running = true


    return BGLocationServiceModule.startLocationForegroundService();
  }

  async startActivityRecognition() {
    return BGLocationServiceModule.startActivityRecognition()
  }

  isRunning() {
    return this.running
  }
  stopBgTask() {
    this.running = false
    // KeyValueStore.clearSession()
    return BGLocationServiceModule.stopLocationForegroundService()
  }

  stopActivityRecognition() {
    return BGLocationServiceModule.stopActivityRecognition()
  }

  unmount(){
    this.running = false
  }

  stopAllTasks() {
    return BGLocationServiceModule.forceStopApp()
  }

  hideOverlay() {
    return BGLocationServiceModule.hideDriverOverlay();
  }
}

const BGLocationTask = new LocationBackgroundTask();
export default BGLocationTask;
