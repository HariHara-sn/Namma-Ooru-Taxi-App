/* eslint-disable class-methods-use-this */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-console */

import { NativeModules } from "react-native";

const { BGLocationServiceModule } = NativeModules;

class DriverWaitingTime {
  constructor() {
    this.running = false
  }

  async startWatingTime() {
    if (this.running) return
    this.running = true
    return BGLocationServiceModule.startTimer();
  }

  isTimerRunning() {
    return this.running
  }

  stopWaitingTime() {
    this.running = false
    return BGLocationServiceModule.stopTimer();
  }

  unmount(){
    this.running = false
  }
}

const driverWaitingTime = new DriverWaitingTime();
export default driverWaitingTime;
