import SpInAppUpdates, {
  IAUUpdateKind,
  StatusUpdateEvent,
} from 'sp-react-native-in-app-updates';
import { Platform, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import useConfigStore from '../notCustomer/store/useConfigStore';

class InAppUpdates {
  constructor() {
    this.updateListener = null;
    this.checkUpdateStatus = this.checkUpdateStatus.bind(this);
    this.progressCallback = null;
    this.downloadedCallback = null;
    this.failedCallback = null;
    this.cancelledCallback = null;
    this.currentInAppUpdates = null;
    this.config = useConfigStore.getState().appConfig;
  }

  /**
   * Set callbacks for UI updates
   */
  setCallbacks({ onProgress, onDownloaded, onFailed, onCancelled }) {
    this.progressCallback = onProgress;
    this.downloadedCallback = onDownloaded;
    this.failedCallback = onFailed;
    this.cancelledCallback = onCancelled;
  }

  /**
   * Set up status listener to check for pending downloads
   */
  setupStatusListener(inAppUpdates) {
    try {
      console.log('[InAppUpdates] Setting up status listener to check pending download...');
      
      // Remove existing listener if any
      this.removeUpdateListener();
      
      let hasReceivedStatus = false;
      
      // Set up new listener
      this.updateListener = inAppUpdates.addStatusUpdateListener((status) => {
        hasReceivedStatus = true;
        console.log('[InAppUpdates] 📡 Status update received (pending check):', JSON.stringify(status, null, 2));
        
        const DOWNLOADED = StatusUpdateEvent?.DOWNLOADED ?? 11;
        const DOWNLOADING = StatusUpdateEvent?.DOWNLOADING ?? 2;
        const PENDING = StatusUpdateEvent?.PENDING ?? 1;
        const FAILED = StatusUpdateEvent?.FAILED ?? 0;
        
        const statusValue = status.status;
        
        switch (statusValue) {
          case DOWNLOADED:
          case 11:
            console.log('[InAppUpdates] ✅ Update already downloaded!');
            if (this.downloadedCallback) {
              this.downloadedCallback();
            }
            break;
          case DOWNLOADING:
          case 2:
            const progress = status.totalBytesToDownload > 0 
              ? Math.round((status.bytesDownloaded / status.totalBytesToDownload) * 100)
              : 0;
            console.log(`[InAppUpdates] ⬇️ Download in progress: ${progress}%`);
            if (this.progressCallback) {
              this.progressCallback(progress);
            }
            break;
          case PENDING:
          case 1:
            console.log('[InAppUpdates] ⏳ Update pending...');
            // Show 0% progress for pending to indicate something is happening
            if (this.progressCallback) {
              this.progressCallback(0);
            }
            break;
          case FAILED:
          case 0:
            console.log('[InAppUpdates] ❌ Update failed');
            if (this.failedCallback) {
              this.failedCallback();
            }
            this.removeUpdateListener();
            break;
          default:
            console.log('[InAppUpdates] 📊 Unknown status:', statusValue);
            break;
        }
      });
      
      // The listener should fire immediately with current status when added
      // But if it doesn't fire within 1 second, show a default state
      setTimeout(() => {
        if (!hasReceivedStatus) {
          console.log('[InAppUpdates] ⚠️ Status listener did not fire immediately, showing default state');
          // Show 0% progress to indicate we're checking/downloading
          // This will be updated when the listener fires
          if (this.progressCallback) {
            this.progressCallback(0);
          }
        }
      }, 1000);
      
      console.log('[InAppUpdates] Status listener set up, waiting for status updates...');
    } catch (error) {
      console.error('[InAppUpdates] Error setting up status listener:', error);
      // If setting up listener fails, show default state
      if (this.progressCallback) {
        this.progressCallback(0);
      }
    }
  }

  /**
   * Check if there's a pending downloaded update on app start
   * For immediate updates, we just start the update if available
   */
  async checkPendingDownload() {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const isDebug = false;
      const inAppUpdates = new SpInAppUpdates(isDebug);
      
      // Check if there's a pending update
      const updateInfo = await inAppUpdates.checkNeedsUpdate();
      console.log('[InAppUpdates] Check pending download - updateInfo:', JSON.stringify(updateInfo, null, 2));
      
      // Check update availability status
      const updateAvailability = updateInfo?.other?.updateAvailability;
      const isImmediateAllowed = updateInfo?.other?.isImmediateUpdateAllowed === true;
      const storeVersionCode = updateInfo?.other?.versionCode || (updateInfo?.storeVersion ? parseInt(updateInfo.storeVersion) : null);
      const currentVersionCode = DeviceInfo.getBuildNumber();
      
      // Verify version codes to ensure there's actually a newer version
      const hasNewerVersion = storeVersionCode && currentVersionCode 
        ? (parseInt(storeVersionCode) > parseInt(currentVersionCode))
        : false;
      
      // Only start update if:
      // 1. Update availability is 1 (UPDATE_AVAILABLE) or 2 (UPDATE_IN_PROGRESS)
      // 2. Immediate updates are allowed
      // 3. Store version is actually newer than device version
      if ((updateAvailability === 1 || updateAvailability === 2) && isImmediateAllowed && hasNewerVersion) {
        console.log('[InAppUpdates] ⚠️ Update available - starting immediate update');
        console.log('[InAppUpdates] Device version:', currentVersionCode, 'Store version:', storeVersionCode);
        await this.startDownload(inAppUpdates);
        return true;
      } else {
        console.log('[InAppUpdates] No update needed or not allowed');
        console.log('[InAppUpdates] Update availability:', updateAvailability);
        console.log('[InAppUpdates] Immediate allowed:', isImmediateAllowed);
        console.log('[InAppUpdates] Has newer version:', hasNewerVersion);
      }
      
      return false;
    } catch (error) {
      console.log('[InAppUpdates] Error checking pending download:', error);
      return false;
    }
  }

  /**
   * Start the download process - IMMEDIATE UPDATE (force update)
   */
  async startDownload(inAppUpdates) {
    const updateOptions = {
      updateType: IAUUpdateKind.IMMEDIATE, // Use immediate updates (force update)
    };

    console.log('[InAppUpdates] Starting immediate update (force update)...');
    console.log('[InAppUpdates] Update options:', JSON.stringify(updateOptions, null, 2));
    
    try {
      // Start the immediate update - Play Store will handle everything
      // This will show the Play Store dialog and force the user to update
      await inAppUpdates.startUpdate(updateOptions);
      console.log('[InAppUpdates] ✅ Immediate update started successfully');
      console.log('[InAppUpdates] Play Store will handle the update process');
    } catch (startError) {
      console.error('[InAppUpdates] ❌ Error starting immediate update:', startError);
      console.error('[InAppUpdates] Error details:', JSON.stringify(startError, null, 2));
      const errorMessage = startError?.message || startError?.toString() || '';
      
      Alert.alert(
        'Update Error',
        'Failed to start the update. Please try again later or update from Play Store.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Check for app updates - Always uses IMMEDIATE update (force update)
   */
  async checkUpdateStatus() {
    // In-app updates are only available on Android
    if (Platform.OS !== 'android') {
      console.log('[InAppUpdates] In-app updates are only available on Android');
      return;
    }

    const isDebug = false;
    console.log('[InAppUpdates] ========================================');
    console.log('[InAppUpdates] 🔍 Starting update check...');
    console.log('[InAppUpdates] Debug mode:', isDebug);
    console.log('[InAppUpdates] Update type: IMMEDIATE (force update)');
    console.log('[InAppUpdates] ========================================');

    try {
      const inAppUpdates = new SpInAppUpdates(isDebug);

      // First, verify app is installed from Play Store
      console.log('[InAppUpdates] Step 1: Verifying installation source...');
      try {
        // Quick check - if this fails with "not owned", we know it's not from Play Store
        const quickCheck = await inAppUpdates.checkNeedsUpdate();
        console.log('[InAppUpdates] ✅ Installation source verified (from Play Store)');
        console.log('[InAppUpdates] Quick check result:', JSON.stringify(quickCheck, null, 2));
      } catch (verifyError) {
        const verifyErrorMsg = verifyError?.message || verifyError?.toString() || '';
        console.log('[InAppUpdates] Verification error:', verifyErrorMsg);
        if (verifyErrorMsg.includes('not owned') || verifyErrorMsg.includes('Install Error(-10)')) {
          console.error('[InAppUpdates] ❌ CRITICAL: App is NOT installed from Google Play Store');
          console.error('[InAppUpdates] ❌ In-app updates will NOT work until app is installed from Play Store');
          // Ensure UI does not show update overlay when Play Store is not available
          useConfigStore.getState().setUpdateAvailable(true);
          console.error('[InAppUpdates] Please install the app from Google Play Store to enable in-app updates');
          // Don't show alert for this in production - it's a development issue
          // if (__DEV__) {
          //   Alert.alert(
          //     'Update Check Failed',
          //     'In-app updates require the app to be installed from Google Play Store.',
          //     [{ text: 'OK' }]
          //   );
          // }
          return;
        }
        console.warn('[InAppUpdates] ⚠️ Verification check had an error, but continuing...', verifyErrorMsg);
      }

      // Get current app version info
      const currentVersionName = DeviceInfo.getVersion();
      const currentVersionCode = DeviceInfo.getBuildNumber();
      console.log('[InAppUpdates] Device Info:');
      console.log('[InAppUpdates]   Current Version Name:', currentVersionName);
      console.log('[InAppUpdates]   Current Version Code:', currentVersionCode);

      // Check for updates
      console.log('[InAppUpdates] Step 2: Checking for available updates...');
      const result = await inAppUpdates.checkNeedsUpdate();
      
      console.log('[InAppUpdates] 📊 Update check result:', JSON.stringify(result, null, 2));
      console.log('[InAppUpdates] Should update?', result?.shouldUpdate);
      console.log('[InAppUpdates] Store version:', result?.storeVersion);
      console.log('[InAppUpdates] Current version:', result?.currentVersion);
      console.log('[InAppUpdates] Is flexible allowed?', result?.other?.isFlexibleUpdateAllowed);
      console.log('[InAppUpdates] Is immediate allowed?', result?.other?.isImmediateUpdateAllowed);
      
      // Check update availability from the result
      const updateAvailability = result?.other?.updateAvailability;
      const isFlexibleAllowed = result?.other?.isFlexibleUpdateAllowed === true;
      const isImmediateAllowed = result?.other?.isImmediateUpdateAllowed === true;
      const storeVersionCode = result?.other?.versionCode || (result?.storeVersion ? parseInt(result.storeVersion) : null);
      
      console.log('[InAppUpdates] Update Availability Status:', updateAvailability);
      console.log('[InAppUpdates] Store Version Code:', storeVersionCode);
      console.log('[InAppUpdates] Device Version Code:', currentVersionCode);
      
      // Additional version comparison
      if (storeVersionCode && currentVersionCode) {
        const deviceVersionCodeNum = parseInt(currentVersionCode) || 0;
        const storeVersionCodeNum = parseInt(storeVersionCode) || 0;
        console.log('[InAppUpdates] Version Code Comparison:');
        console.log('[InAppUpdates]   Device:', deviceVersionCodeNum);
        console.log('[InAppUpdates]   Store:', storeVersionCodeNum);
        console.log('[InAppUpdates]   Update needed?', storeVersionCodeNum > deviceVersionCodeNum);
        
        // If version codes indicate update needed but shouldUpdate is false
        if (storeVersionCodeNum > deviceVersionCodeNum && !result.shouldUpdate) {
          // Check update availability status
          // Status 3 = UPDATE_NOT_AVAILABLE, but version codes suggest otherwise
          // Status 2 = UPDATE_IN_PROGRESS (downloading or downloaded) - don't show "Update Pending"
          if (updateAvailability === 3) {
            console.warn('[InAppUpdates] ⚠️ WARNING: Version codes indicate update needed, but Play Store says no update available!');
            console.warn('[InAppUpdates] This might be a timing issue - Play Store may need more time to propagate');
            console.warn('[InAppUpdates] Try waiting a few minutes and check again');
            // Don't show alert - just log silently
            return;
          } else if (updateAvailability === 2) {
            // Update is in progress - start immediate update
            // setUpdateAvailable is a store action, not on appConfig; call via store
            useConfigStore.getState().setUpdateAvailable(true);
            console.log('[InAppUpdates] Update is in progress - starting immediate update');
            this.startDownload(inAppUpdates);
            return;
          }
        }
      }

      // Check update availability status
      // Update availability: 1 = UPDATE_AVAILABLE, 2 = UPDATE_IN_PROGRESS, 3 = UPDATE_NOT_AVAILABLE
      // For immediate updates, we don't need to handle status 2 (in progress) - just start the update
      if (updateAvailability === 2) {
        console.log('[InAppUpdates] ⚠️ Update is already in progress');
        console.log('[InAppUpdates] Starting immediate update to complete the process...');
        // For immediate updates, just start the update - Play Store will handle it
        this.startDownload(inAppUpdates);
        return;
      }
      
      // Only proceed if updateAvailability is 1 (UPDATE_AVAILABLE)
      // Also verify version codes to ensure there's actually a newer version
      const hasNewerVersion = storeVersionCode && currentVersionCode 
        ? (parseInt(storeVersionCode) > parseInt(currentVersionCode))
        : false;
      
      const isUpdateAvailable = updateAvailability === 1 && hasNewerVersion;
      
      if (isUpdateAvailable) {
        console.log('[InAppUpdates] ✅ UPDATE AVAILABLE!');
        console.log('[InAppUpdates] Version codes confirm update is needed');
        
        // Only proceed if immediate updates are allowed
        if (!isImmediateAllowed) {
          console.log('[InAppUpdates] ⚠️ Update available but immediate updates are not allowed');
          console.log('[InAppUpdates] User should update from Play Store');
          Alert.alert(
            'Update Available',
            'A new version is available. Please update from the Play Store.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        console.log('[InAppUpdates] Starting immediate update process...');
        console.log('[InAppUpdates] Using IMMEDIATE update (force update)');
        
        // Directly start download - Play Store will show its native dialog and force update
        console.log('[InAppUpdates] Starting immediate update - Play Store dialog will appear');
        this.startDownload(inAppUpdates);
      } else {
        // No update available
        if (updateAvailability === 3) {
          console.log('[InAppUpdates] ℹ️ No update available (UPDATE_NOT_AVAILABLE)');
        } else if (updateAvailability === 1 && !hasNewerVersion) {
          console.log('[InAppUpdates] ℹ️ Update availability is 1, but version codes show no update needed');
          console.log('[InAppUpdates] Device version:', currentVersionCode, 'Store version:', storeVersionCode);
        } else {
          console.log('[InAppUpdates] ℹ️ No update available');
        }
        console.log('[InAppUpdates] App is up to date or update check returned false');
        console.log('[InAppUpdates] Result details:', {
          shouldUpdate: result?.shouldUpdate,
          storeVersion: result?.storeVersion,
          currentVersion: result?.currentVersion,
          updateAvailability: updateAvailability,
          isFlexibleAllowed: isFlexibleAllowed,
          isImmediateAllowed: isImmediateAllowed
        });
      }
    } catch (error) {
      console.error('[InAppUpdates] ❌❌❌ ERROR in update check:', error);
      
      // Handle specific error cases
      const errorMessage = error?.message || error?.toString() || '';
      console.error('[InAppUpdates] Error message:', errorMessage);
      console.error('[InAppUpdates] Full error:', JSON.stringify(error, null, 2));
      if (error?.stack) {
        console.error('[InAppUpdates] Stack trace:', error.stack);
      }
      
      if (errorMessage.includes('not owned') || errorMessage.includes('Install Error(-10)')) {
        console.error('[InAppUpdates] ⚠️⚠️⚠️ App NOT installed from Google Play Store');
        console.error('[InAppUpdates] This is the most common issue!');
        // Don't show alert for this in production - it's a development issue
        if (__DEV__) {
          Alert.alert(
            'Update Check Failed',
            'In-app updates require the app to be installed from Google Play Store.',
            [{ text: 'OK' }]
          );
        }
      } else if (!errorMessage.includes('Update not available') && !errorMessage.includes('no update available')) {
        console.error('[InAppUpdates] Unexpected error occurred');
        // Show generic error alert for unexpected errors
        Alert.alert(
          'Update Check Error',
          'Unable to check for updates. Please try again later.',
          [{ text: 'OK' }]
        );
      } else {
        console.log('[InAppUpdates] ℹ️ No update available (this is normal)');
      }
      
      // Don't throw - we don't want update checks to crash the app
    }
    
    console.log('[InAppUpdates] ========================================');
  }

  /**
   * Remove update status listener
   */
  removeUpdateListener() {
    if (this.updateListener) {
      this.updateListener.remove();
      this.updateListener = null;
    }
  }

  /**
   * Check for flexible update (allows user to continue using app)
   * This is the default and only update method
   */
  async checkFlexibleUpdate() {
    console.log('[InAppUpdates] checkFlexibleUpdate() called');
    await this.checkUpdateStatus();
  }

  /**
   * Check for immediate update - DEPRECATED: Now uses flexible update
   * Kept for backward compatibility
   */
  async checkImmediateUpdate() {
    await this.checkUpdateStatus();
  }

  /**
   * Check if app is installed from Google Play Store
   * This is required for in-app updates to work
   */
  async isInstalledFromPlayStore() {
    console.log('[InAppUpdates] Checking if app is installed from Play Store...');
    if (Platform.OS !== 'android') {
      console.log('[InAppUpdates] Not Android, returning false');
      return false;
    }

    try {
      const inAppUpdates = new SpInAppUpdates(__DEV__ || true);
      await inAppUpdates.checkNeedsUpdate();
      console.log('[InAppUpdates] ✅ App is installed from Play Store');
      return true;
    } catch (error) {
      const errorMessage = error?.message || error?.toString() || '';
      console.log('[InAppUpdates] Error checking Play Store installation:', errorMessage);
      if (errorMessage.includes('not owned') || errorMessage.includes('Install Error(-10)')) {
        console.log('[InAppUpdates] ❌ App is NOT installed from Play Store');
        return false;
      }
      console.log('[InAppUpdates] ⚠️ Unknown error, assuming app is from Play Store');
      return true;
    }
  }

  /**
   * Get diagnostic information about the update system
   */
  async getDiagnostics() {
    console.log('[InAppUpdates] 🔬 DIAGNOSTICS MODE');
    console.log('[InAppUpdates] ========================================');
    
    if (Platform.OS !== 'android') {
      console.log('[InAppUpdates] ⚠️ In-app updates only work on Android');
      Alert.alert('Diagnostics', 'In-app updates only work on Android', [{ text: 'OK' }]);
      return;
    }

    try {
      const currentVersionName = DeviceInfo.getVersion();
      const currentVersionCode = DeviceInfo.getBuildNumber();
      console.log('[InAppUpdates] Device Version Info:');
      console.log('[InAppUpdates]   Version Name:', currentVersionName);
      console.log('[InAppUpdates]   Version Code:', currentVersionCode);
      
      const inAppUpdates = new SpInAppUpdates(__DEV__ || true);
      const result = await inAppUpdates.checkNeedsUpdate();
      
      console.log('[InAppUpdates] ✅ Update check successful');
      console.log('[InAppUpdates] Full result:', JSON.stringify(result, null, 2));
      console.log('[InAppUpdates] Should update:', result?.shouldUpdate);
      console.log('[InAppUpdates] Store version:', result?.storeVersion);
      console.log('[InAppUpdates] Current version (from library):', result?.currentVersion);
      
      const storeVersionCode = result?.storeVersion ? parseInt(result.storeVersion) || 0 : 0;
      const deviceVersionCode = parseInt(currentVersionCode) || 0;
      
      console.log('[InAppUpdates] Version Code Analysis:');
      console.log('[InAppUpdates]   Device Version Code:', deviceVersionCode);
      console.log('[InAppUpdates]   Store Version Code:', storeVersionCode);
      console.log('[InAppUpdates]   Difference:', storeVersionCode - deviceVersionCode);
      
      let message = `Current Version: ${currentVersionName} (${deviceVersionCode})\n`;
      message += `Store Version: ${result?.storeVersion || 'Unknown'}\n`;
      message += `Update Available: ${result?.shouldUpdate ? 'Yes' : 'No'}\n\n`;
      
      if (storeVersionCode > deviceVersionCode && !result.shouldUpdate) {
        console.warn('[InAppUpdates] ⚠️ BUT shouldUpdate is FALSE - This is the issue!');
        console.warn('[InAppUpdates] Possible causes:');
        console.warn('[InAppUpdates]   1. Update not fully propagated (wait 10-30 minutes)');
        console.warn('[InAppUpdates]   2. Library cache issue (restart app)');
        console.warn('[InAppUpdates]   3. Play Store API delay');
        message += '⚠️ Update exists but not ready yet. Wait 10-30 minutes.';
      } else if (result?.shouldUpdate) {
        console.log('[InAppUpdates] ✅✅✅ UPDATE IS AVAILABLE!');
        message += '✅ Update is available!';
      } else {
        console.log('[InAppUpdates] ℹ️ No update available (shouldUpdate: false)');
        message += '✅ App is up to date.';
      }
      
      Alert.alert('Update Diagnostics', message, [{ text: 'OK' }]);
      
      return result;
    } catch (error) {
      console.error('[InAppUpdates] ❌ Diagnostic check failed');
      console.error('[InAppUpdates] Error:', error?.message || error);
      console.error('[InAppUpdates] Full error:', JSON.stringify(error, null, 2));
      
      const errorMessage = error?.message || error?.toString() || '';
      
      if (errorMessage.includes('not owned') || errorMessage.includes('Install Error(-10)')) {
        console.error('[InAppUpdates] ⚠️ App is NOT installed from Play Store');
        console.error('[InAppUpdates] This is why in-app updates are not working!');
        Alert.alert(
          'Diagnostics',
          'App is NOT installed from Play Store. In-app updates require installation from Play Store.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Diagnostics Error',
          `Unable to check updates: ${errorMessage}`,
          [{ text: 'OK' }]
        );
      }
      
      throw error;
    } finally {
      console.log('[InAppUpdates] ========================================');
    }
  }

  /**
   * Force update check with retry mechanism
   * Sometimes Play Store needs time to propagate updates
   */
  async checkUpdateWithRetry(maxRetries = 3, delayMs = 5000) {
    console.log('[InAppUpdates] 🔄 Retry mode: Will check', maxRetries, 'times with', delayMs/1000, 'second delays');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[InAppUpdates] Attempt ${attempt}/${maxRetries}...`);
      
      try {
        const inAppUpdates = new SpInAppUpdates(__DEV__ || true);
        const result = await inAppUpdates.checkNeedsUpdate();
        
        console.log(`[InAppUpdates] Attempt ${attempt} result:`, JSON.stringify(result, null, 2));
        
        if (result?.shouldUpdate) {
          console.log('[InAppUpdates] ✅ Update found on attempt', attempt);
          // Found update, proceed with update process
          await this.checkUpdateStatus();
          return;
        } else {
          console.log(`[InAppUpdates] ⏳ No update on attempt ${attempt}, shouldUpdate:`, result?.shouldUpdate);
          if (attempt < maxRetries) {
            console.log(`[InAppUpdates] Waiting ${delayMs/1000}s before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      } catch (error) {
        console.error(`[InAppUpdates] ❌ Error on attempt ${attempt}:`, error?.message);
        console.error(`[InAppUpdates] Full error:`, JSON.stringify(error, null, 2));
        if (attempt < maxRetries) {
          console.log(`[InAppUpdates] Waiting ${delayMs/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    console.log('[InAppUpdates] ⚠️ No update found after', maxRetries, 'attempts');
    console.log('[InAppUpdates] 💡 The update might not be fully propagated yet');
    console.log('[InAppUpdates] 💡 Try again in 10-30 minutes');
    
    Alert.alert(
      'Update Check',
      'No update found after multiple attempts. The update might not be fully propagated yet. Please try again in 10-30 minutes.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Manual test method - Call this from React Native Debugger or DevTools console
   * Usage: InAppUpdates.testUpdate()
   */
  async testUpdate() {
    console.log('[InAppUpdates] 🧪 TEST MODE: Starting manual update check...');
    console.log('[InAppUpdates] Platform:', Platform.OS);
    console.log('[InAppUpdates] Debug mode:', __DEV__);
    
    // First run diagnostics
    try {
      console.log('[InAppUpdates] Running diagnostics first...');
      await this.getDiagnostics();
    } catch (error) {
      console.error('[InAppUpdates] Diagnostics failed, but continuing with update check...', error);
    }
    
    // Then try the update check with retry
    console.log('[InAppUpdates] 💡 Trying update check with retry mechanism...');
    await this.checkUpdateWithRetry(3, 5000);
  }

  /**
   * Install a downloaded flexible update
   */
  async installUpdate() {
    if (Platform.OS !== 'android') {
      console.log('[InAppUpdates] In-app updates are only available on Android');
      return;
    }

    try {
      const isDebug = __DEV__ || true;
      console.log('[InAppUpdates] Installing downloaded update...');
      
      // Show alert before installation
      Alert.alert(
        'Installing Update',
        'The app will restart to install the update. Please wait...',
        [{ text: 'OK' }]
      );
      
      const inAppUpdates = new SpInAppUpdates(isDebug);
      await inAppUpdates.installUpdate();
      console.log('[InAppUpdates] ✅ Update installation initiated');
      this.removeUpdateListener();
    } catch (error) {
      console.error('[InAppUpdates] ❌ Error installing update:', error);
      Alert.alert(
        'Installation Failed',
        'Failed to install the update. Please try again or update from Play Store.',
        [{ text: 'OK' }]
      );
    }
  }
}

export default new InAppUpdates();

