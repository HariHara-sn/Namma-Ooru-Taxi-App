import {Linking, NativeModules, DeviceEventEmitter} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect} from 'react';
import { useTripAcceptStore } from '../../notdriver/store/useTripAcceptStore';
import { useStackScreenStore } from '../store/useStackScreenStore';
import useCurrentScreenStore from '../store/useCurrentScreenStore';


const parseQuery = url => {
  const i = url.indexOf('?');
  if (i === -1) return {};
  const query = url.slice(i + 1);
  const params = {};
  query.split('&').forEach(kv => {
    const [k, v = ''] = kv.split('=');
    const key = decodeURIComponent(k || '');
    const val = decodeURIComponent(v.replace(/\+/g, ' '));
    if (key) params[key] = val;
  });
  return params;
};

const OVERLAY_PAYLOAD_KEY = 'overlay_last_payload';

const HandleTripDeepLinking = () => {
const { setTripId ,setCurrentFare, tripId, currentFare} = useTripAcceptStore();
const { setStackScreen, stackScreen} = useStackScreenStore();
const { setCurrentScreen } = useCurrentScreenStore();

  useEffect(() => {
    const handleDeepLink = async event => {
      const url = event.url;
      try {
        const params = parseQuery(url);
        if (params.src === 'overlay' && params.action === 'view_details') {
          if (params.title === 'new trip request') {
            console.log('[Overlay] Deep link received:', {
              title: params.title,
              message: params.message,
            });
            try {
              const raw = await AsyncStorage.getItem(OVERLAY_PAYLOAD_KEY);
              const full = JSON.parse(raw || '{}');
              const tripId = full.data?.tripId
              const currentFare = full.data?.currentFare
              if (tripId) {
                // console.log('hari-->>tripId-->>', tripId)
                // console.log('hari-->>currentFare-->>', currentFare)
                setTripId(tripId)
                setCurrentFare(currentFare)
                // Defer stack switch so that stores/UI are settled
                setTimeout(() => {
                  setStackScreen('TripAccept')
                }, 0)
              } else {
                console.log('tripId not found in notification data');
              }
            } catch {}
          }
        }
      } catch (e) {
        console.log('DeepLink parse error', e);
      }
    };

    Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(initialUrl => {
      if (initialUrl) handleDeepLink({url: initialUrl});
    });
  }, []);

  // useEffect(() => {
  //   overlayController.stopOverlay().catch(() => {});

  //   const subscription = AppState.addEventListener('change', state => {
  //     if (state === 'active') {
  //       overlayController.stopOverlay().catch(() => {});
  //     } else if (state === 'background') {
  //       overlayController.restartOverlayIfPermitted().catch(() => {});
  //     }
  //   });

  //   return () => {
  //     subscription?.remove?.();
  //   };
  // }, []);

  return <></>;
};

export default HandleTripDeepLinking;
