import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NavBar from '../../../components/NavBar';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import { colors, Fonts } from '../../../constants/constants';
import useConfigStore from '../../../store/useConfigStore';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import { updateNotificationPreferences } from '../.././../API/EndPoints/EndPoints';

const STORAGE_KEY = '@notification_settings';

// Icon mapping for known notification types from config
const TYPE_ICON_MAP = {
  overspeedalert: 'speedometer-outline',
  hardaccelerationalert: 'flash-outline',
  trip_updates: 'car-outline',
  driver_arrival: 'location-outline',
  payment_alerts: 'wallet-outline',
  promotions: 'pricetag-outline',
};

const FALLBACK_ITEMS = [
  { id: 'overspeedalert', name: 'Overspeeding Alert', disabled: false },
  { id: 'trip_updates', name: 'Trip Updates', disabled: false },
  { id: 'driver_arrival', name: 'Driver Arrival', disabled: false },
  { id: 'payment_alerts', name: 'Payment Alerts', disabled: false },
  { id: 'promotions', name: 'Promotions & Offers', disabled: false },
];

const NotificationSettingsScreen = () => {
  const { goBack } = useStackScreenStore();
  const { appConfig } = useConfigStore();
  const { userdetails, setUserdetails } = useUserInfoStore();
  const [settings, setSettings] = useState({});

  // Resolve items from appConfig or fall back to defaults
  const notificationItems = useMemo(() => {
    const configItems = appConfig?.NOTIFICATION_PREFERENCE;
    const raw = Array.isArray(configItems) && configItems.length > 0
      ? configItems
      : FALLBACK_ITEMS;
    return raw.map(item => ({
      id: String(item.type ?? item.id),
      label: item.name,
      disabled: item.disabled ?? false,
      icon: TYPE_ICON_MAP[String(item.type ?? item.id)] ?? 'notifications-outline',
    }));
  }, [appConfig]);

  // Initialise from config defaults, overridden by server prefs (source of truth).
  // AsyncStorage is NOT used for initial state to avoid stale values overriding config.
  useEffect(() => {
    const serverPrefs = userdetails?.notificationPreferences;
    // Default: enabled when config says disabled:false
    const defaults = notificationItems.reduce((acc, item) => {
      acc[item.id] = !item.disabled;
      return acc;
    }, {});
    // Server prefs override defaults (explicit user choices synced to backend)
    const serverMap = Array.isArray(serverPrefs)
      ? serverPrefs.reduce((acc, p) => { acc[p.type] = !p.disabled; return acc; }, {})
      : {};
    setSettings({ ...defaults, ...serverMap });
  }, [notificationItems, userdetails?.notificationPreferences]);

  const toggle = async (id, value) => {
    const updated = { ...settings, [id]: value };
    setSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Build the full preferences array from current notificationItems + updated map
    const prefsPayload = notificationItems.map(item => ({
      type: item.id,
      name: item.label,
      disabled: !updated[item.id],
    }));

    try {
      const res = await updateNotificationPreferences(prefsPayload);
      console.log('Notification preferences updated:', res);
      if (res?.success && res?.user) {
        setUserdetails({ ...userdetails, notificationPreferences: res.user.notificationPreferences });
      }
    } catch (err) {
      console.error('Failed to sync notification preferences:', err);
    }
  };

//   console.log("Notification Items:", notificationItems);

  return (
    <View style={styles.container}>
      <NavBar withBg title="Notification Settings" onBackPress={goBack} />
      <ScrollView contentContainerStyle={styles.listContent}>
        <Text style={styles.sectionLabel}>Manage which notifications you receive</Text>
        {notificationItems.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.row,
              index < notificationItems.length - 1 && styles.rowBorder,
            ]}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color={colors.violet} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>{item.label}</Text>
            </View>
            <Switch
              value={!!settings[item.id]}
              onValueChange={val => toggle(item.id, val)}
              trackColor={{ false: colors.grey_light, true: colors.violet }}
              thumbColor={settings[item.id] ? colors.white : colors.grey_dark}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: colors.grey_xxdark,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.grey_light,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.grey_xxlight ?? '#f0f0f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: colors.black,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: colors.grey_xxdark,
  },
});

export default NotificationSettingsScreen;
