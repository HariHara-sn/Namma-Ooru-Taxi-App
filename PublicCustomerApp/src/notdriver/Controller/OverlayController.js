/* eslint-disable class-methods-use-this */
/* eslint-disable no-async-promise-executor */
/* eslint-disable no-console */

import {NativeModules, Platform} from 'react-native';
import { ensureOverlayPermission } from '../../common/controllers/PermissionHandler';

const {OverlayModule} = NativeModules;

class OverlayController {
  constructor() {}

  async startOverlay() {
    const ok = await ensureOverlayPermission();
    if (!ok) return;
    // Always restart to ensure we get a fresh bubble/session
    try {
      await this.stopOverlay();
    } catch (e) {}
    await OverlayModule.startOverlay();
  }

  async stopOverlay() {
    if (Platform.OS !== 'android') return;
    await OverlayModule.stopOverlay();
  }

  // Call this when returning from Settings or after permission flow
  async restartOverlayIfPermitted() {
    const ok = await ensureOverlayPermission();
    if (!ok) return;
    try {
      await this.stopOverlay();
    } catch (e) {}
    await OverlayModule.startOverlay();
  }
}

const overlayController = new OverlayController();
export default overlayController;
