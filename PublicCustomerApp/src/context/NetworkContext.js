import React, { createContext, useContext, useState, useEffect } from 'react';
import NetworkConnectivity from '../common/controllers/NetworkConnectivity';
import PropTypes from 'prop-types';

const NetworkContext = createContext();

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Initialize network connectivity monitoring
    NetworkConnectivity.init();

    // Add listener for network changes
    const unsubscribe = NetworkConnectivity.addListener((connected) => {
      setIsConnected(connected);
    });

    // Check initial connection status
    checkConnection();

    return () => {
      unsubscribe();
      NetworkConnectivity.cleanup();
    };
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await NetworkConnectivity.checkConnection();
      setIsConnected(connected);
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const value = {
    isConnected,
    isChecking,
    checkConnection,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

NetworkProvider.propTypes = {
  children: PropTypes.node.isRequired,
}; 