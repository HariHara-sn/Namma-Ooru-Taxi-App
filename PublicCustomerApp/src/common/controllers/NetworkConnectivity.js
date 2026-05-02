import NetInfo from '@react-native-community/netinfo';
import { NativeModules } from 'react-native';

const { NeNativeModule } = NativeModules;

class NetworkConnectivity {
  constructor() {
    this.isConnected = true;
    this.listeners = [];
    this.unsubscribe = null;
  }

  // Initialize network monitoring
  init() {
    this.unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected && state.isInternetReachable;
      
      // Notify listeners if connection status changed
      if (wasConnected !== this.isConnected) {
        this.notifyListeners(this.isConnected);
      }
    });
  }

  // Add a listener for network status changes
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  notifyListeners(isConnected) {
    this.listeners.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in network connectivity listener:', error);
      }
    });
  }

  // Check current connection status
  async checkConnection() {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected && state.isInternetReachable;
    return this.isConnected;
  }

  // Check connection using native Android method (if available)
  async checkNativeConnection() {
    try {
      if (NeNativeModule && NeNativeModule.isInternetAvailable) {
        // This would need to be implemented in the native module
        // For now, we'll use the NetInfo method
        return await this.checkConnection();
      }
      return await this.checkConnection();
    } catch (error) {
      console.error('Error checking native connection:', error);
      return await this.checkConnection();
    }
  }

  // Get current connection status synchronously
  getConnectionStatus() {
    return this.isConnected;
  }

  // Cleanup
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
  }
}

export default new NetworkConnectivity(); 