/* eslint-disable class-methods-use-this */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-console */

import { NativeModules } from 'react-native';
import Sound from 'react-native-sound';

const { PlayTripSoundModule } = NativeModules

class TripAlert {
  constructor() {
    this.initialized = false;
    this.sounds = {
      tripalert: null,
      driver_allocated: null,
    };
    this.currentSound = null;
  }

  initialize() {
    // Idempotent init to set audio category and preload sounds
    if (this.initialized) return Promise.resolve(true);
    return new Promise((resolve) => {
      try {
        // Allow mixing with other audio (navigation, music)
        Sound.setCategory('Playback', true);

        // Preload default trip alert
        this._loadSoundWithFallback('tripalert')
          .then((snd) => {
            this.sounds.tripalert = snd;
          })
          .catch((e) => console.warn('[TripAlert] Failed to preload tripalert:', e));

        // Preload driver allocated sound
        this._loadSoundWithFallback('driver_allocated')
          .then((snd) => {
            this.sounds.driver_allocated = snd;
          })
          .catch((e) => console.warn('[TripAlert] Failed to preload driver_allocated:', e));

        this.initialized = true;
        resolve(true);
      } catch (err) {
        console.warn('[TripAlert] initialize error:', err);
        resolve(false);
      }
    });
  }

  async playAlertSound() {
    // Looping trip alert until explicitly stopped
    try {
      const snd = await this._ensureSound('tripalert');
      // Stop any currently playing sound first
      this._stopCurrent();
      // Loop indefinitely
      try { snd.setNumberOfLoops(-1); } catch (_) {}
      this.currentSound = snd;
      return new Promise((resolve) => {
        snd.play((success) => {
          if (!success) {
            console.warn('[TripAlert] tripalert playback failed, retrying once');
            // Retry once after small delay
            setTimeout(() => snd.play(() => resolve(true)), 150);
          } else {
            resolve(true);
          }
        });
      });
    } catch (err) {
      console.warn('[TripAlert] playAlertSound error:', err);
      return false;
    }
  }

  async playDriverAllocatedAlert() {
    try {
      const snd = await this._ensureSound('driver_allocated');
      // Play once, no loop
      try { snd.setNumberOfLoops(0); } catch (_) {}
      this._stopCurrent();
      this.currentSound = snd;
      return new Promise((resolve) => {
        snd.play(() => resolve(true));
      });
    } catch (err) {
      console.warn('[TripAlert] playDriverAllocatedAlert error:', err);
      return false;
    }
  }

  stopAlertSound() {
    // Stop current playing sound and reset loops
    this._stopCurrent();
    // Also ensure any preloaded looping sound is halted
    // ['tripalert', 'driver_allocated'].forEach((key) => {
    //   const s = this.sounds[key];
    //   if (s) {
    //     try { s.setNumberOfLoops(0); } catch (_) {}
    //     try { s.stop(); } catch (_) {}
    //   }
    // });
    PlayTripSoundModule.stopAlertSound();
    return true;
  }

  // ===== Internals =====
  _stopCurrent() {
    const s = this.currentSound;
    if (s) {
      try { s.setNumberOfLoops(0); } catch (_) {}
      try { s.stop(); } catch (_) {}
    }
    this.currentSound = null;
  }

  _ensureSound(name) {
    // Return preloaded sound or load on demand
    const preloaded = this.sounds[name];
    if (preloaded) return Promise.resolve(preloaded);
    return this._loadSoundWithFallback(name).then((snd) => {
      this.sounds[name] = snd;
      return snd;
    });
  }

  _loadSoundWithFallback(name) {
    // Try without extension first (Android res/raw), then with .mp3
    return new Promise((resolve, reject) => {
      try {
        const attempt = (fileName, onFail) => {
          const s = new Sound(fileName, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
              if (onFail) return onFail(error);
              return reject(error);
            }
            resolve(s);
          });
        };
        attempt(name, () => attempt(`${name}.mp3`, (e2) => reject(e2)));
      } catch (err) {
        reject(err);
      }
    });
  }
}

const tripAlert = new TripAlert();
export default tripAlert;

