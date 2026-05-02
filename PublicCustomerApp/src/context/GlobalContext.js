import React, {createContext, useEffect, useState, useCallback} from 'react';
import PropTypes from 'prop-types';
import {useColorScheme} from 'react-native';

import { DataStore } from '../common/controllers/DataStore';
import wsService from '../notCustomer/controllers/SocketServices';
import { lightTheme, darkTheme } from '../common/constants/theme';
import notwsService from '../common/controllers/socketServices/NOTSocketServices';
import publicrideDriverApi from '../notdriver/api/publicrideDriverApi';
import RideMatchWSService from '../common/controllers/socketServices/RideMatchSocketService';
import useUserStore from '../common/store/useUserStore';
import { resetTo } from '../navigation/RootNavigation';
import usePublicDriverStore from '../notdriver/store/usePublicDriverStore';
import {
  registerGlobalModal,
  unregisterGlobalModal,
} from '../common/core/GlobalModalService';

export const GlobalContext = createContext();

export const ContextProvider = ({children}) => {
  const systemColorScheme = useColorScheme();
  
  const [theme, setTheme] = useState(() => {
    // Initialize with device theme immediately
    return systemColorScheme === 'dark' ? darkTheme : lightTheme;
  });
  const [themeMode, setThemeMode] = useState('default'); // 'light', 'dark', 'default'
  const [isInitialized, setIsInitialized] = useState(false);
  const {setUserInfo} = useUserStore()

  const {resetPublicDriverState} = usePublicDriverStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('');
  const [modalImage, setModalImage] = useState('');

  const showModal = useCallback((title, message, options = {}) => {
    const isStringOption = typeof options === 'string';
    const optionObject = isStringOption ? {type: options} : options;

    setModalTitle(title);
    setModalMessage(message);
    setModalType(optionObject?.type ?? '');
    setModalImage(optionObject?.imageName ?? '');
    setModalVisible(true);
  }, []);

  const hideModal = useCallback(() => {
    setModalVisible(false);
    setModalTitle('');
    setModalMessage('');
    setModalType('');
    setModalImage('');
  }, []);

  const themeOperations = useCallback((mode) => {
    let newTheme;
    let isDefault = false;
    
    switch (mode) {
      case 'dark':
        newTheme = darkTheme;
        isDefault = false;
        break;
      case 'light':
        newTheme = lightTheme;
        isDefault = false;
        break;
      case 'default':
        newTheme = systemColorScheme === 'dark' ? darkTheme : lightTheme;
        isDefault = true;
        break;
      default:
        newTheme = lightTheme;
        isDefault = false;
    }
    
    setTheme(newTheme);
    setThemeMode(mode);
    saveThemeSettings(mode, isDefault);
  }, [systemColorScheme]);

  const saveThemeSettings = useCallback(async (mode, isDefault) => {
    try {
      if(mode){
        await DataStore.storeData('ThemeMode', mode);
      }
      if(isDefault){
        await DataStore.storeData('IsDefault', isDefault);
      }
    } catch (error) {
      console.log('Error saving theme settings:', error);
    }
  }, []);

  const getAppTheme = useCallback(async () => {
    try {
      const savedThemeMode = await DataStore.loadData('ThemeMode');
      const isDefault = await DataStore.loadData('IsDefault');
      
      if (savedThemeMode?.data) {
        // User has explicitly set a theme
        themeOperations(savedThemeMode.data);
      } else if (isDefault?.data) {
        // User has chosen to follow system theme
        themeOperations('default');
      } else {
        // First time app launch - use current device theme
     
        themeOperations('default');
      }
    } catch (error) {
      console.error('Error loading theme settings:', error);
      // Fallback to current device theme
     
      themeOperations('default');
    } finally {
      setIsInitialized(true);
    }
  }, [themeOperations, systemColorScheme]);

  const toggleTheme = useCallback(() => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    themeOperations(newMode);
  }, [themeMode, themeOperations]);

  const resetToSystemTheme = useCallback(() => {
    themeOperations('default');
  }, [themeOperations]);

  const getCurrentDeviceTheme = useCallback(() => {
    return systemColorScheme;
  }, [systemColorScheme]);

  const addListener = useCallback(async token => {
    try {
      // Initialize main socket service
      await wsService.initSocket(token);
    
      // Initialize ride matching socket service (optional)
     
    } catch (error) {
      console.error('Error initializing main socket:', error);
    }
  }, []);

  const addNOTSocketListener = useCallback(async token => {
    try {
      await notwsService.initSocket(token); 
    } catch (error) {
      console.error('Error initializing main socket:', error);
    }
  }, []);

  const addRideMatchListener = useCallback(async(id)=> {
    RideMatchWSService.initDriverRoomSocket(id).then((res)=>{
      if (res) {
        RideMatchWSService.emit('join_driver_room', { driver_id: id })
      }
    })
    await publicrideDriverApi.initToken()
  },[])

  const removeListener = useCallback(async () => {
    try {
      await wsService.close();
    } catch (error) {
      console.error('Error removing listener:', error);
    }
  }, []);

  // Update theme when system color scheme changes (only if using default mode)
  useEffect(() => {
    if (themeMode === 'default' && isInitialized) {
      const newTheme = systemColorScheme === 'dark' ? darkTheme : lightTheme;
      setTheme(newTheme);
      
    }
  }, [systemColorScheme, themeMode, isInitialized]);

    const logout = async () => {
    try {
      // setIsLoading(true);
      setUserInfo(null);
      resetPublicDriverState();
      // DataStore.clearData('userInfo');
      DataStore.clearData('role')
      DataStore.clearData('activeTripId')
      DataStore.clearSession();
      DataStore.clearSession('userdetails');
      DataStore.clearSession('access_token');
      RideMatchWSService.removeListeners();
      RideMatchWSService.close();
      resetTo('LoginScreen');
      // showNotification(
      //   t.logout_success,
      //   t.login_to,
      //   'success',
      // );
      // setIsLoading(false);
    } catch (error) {
      console.log('API==Err==>logout', error);
      // showNotification(error?.message ?? t.cant_proceed_now, t.pls_try_later, 'danger');
      // setIsLoading(false);
    }
  };

  // Initialize theme on component mount
  useEffect(() => {
    getAppTheme();
  }, [getAppTheme]);

  useEffect(() => {
    registerGlobalModal({show: showModal, hide: hideModal});

    return () => {
      unregisterGlobalModal();
    };
  }, [showModal, hideModal]);

  const isDarkMode =
    themeMode === 'dark' ||
    (themeMode === 'default' && systemColorScheme === 'dark');

  const contextValue = {
    theme,
    themeMode,
    setTheme: themeOperations,
    toggleTheme,
    resetToSystemTheme,
    getCurrentDeviceTheme,
    addListener,
    removeListener,
    addNOTSocketListener,
    addRideMatchListener,
    isDarkMode,
    systemColorScheme,
    isInitialized,
    themeOperations,
    logout,
    modalVisible,
    modalTitle,
    modalMessage,
    modalType,
    modalImage,
    showModal,
    hideModal,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext;

ContextProvider.propTypes = {
    children: PropTypes.any.isRequired,
};
