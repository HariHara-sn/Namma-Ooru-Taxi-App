import React, { useEffect } from 'react'
import { NativeModules, NativeEventEmitter } from 'react-native';
import useTripsStore from '../store/useTripsStore';


const { BGLocationServiceModule } = NativeModules;
const timerEmitter = new NativeEventEmitter(BGLocationServiceModule);

function convertSecondsToMinutes(seconds) {
  return Math.floor(seconds / 60);  // or use Math.round(seconds / 60) for rounding
}

const WaitingTime = ({setWaitingTime, onFinalTime}) => {
  const getNonreachedStops = useTripsStore.getState().getNonreachedStops;
  useEffect(() => {
  const tickSub = timerEmitter.addListener("TIMER_TICK", ({ seconds }) => {
    setWaitingTime(seconds)
  });
  
  const completeSub = timerEmitter.addListener("TIMER_COMPLETE", ({ finalSeconds }) => {
    const minutes = finalSeconds > 60 ? finalSeconds : 0
    const _convertedMin = convertSecondsToMinutes(minutes)
    const latestNonreached = getNonreachedStops();
    const { activeTripData } = useTripsStore.getState();
    const nextStopNumber = activeTripData?.[0]?.stops?.filter(stop => stop?.stopUpdated)?.length ?? 0;
    onFinalTime(_convertedMin, latestNonreached, nextStopNumber)
  });

  return () => {
    tickSub.remove();
    completeSub.remove();
  };
}, []);



return (
     <>
     </>
);
}

export default WaitingTime