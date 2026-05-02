import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NavBar from '../../../components/NavBar';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import { colors, Fonts } from '../../../constants/constants';
import useCurrentRideInfoStore from '../store/useCurrentRideInfoStore';
import { updateNotificationPreferences } from '../../../API/EndPoints/EndPoints';

const TYPE_CONFIG = {
  overspeedalert: {
    icon: 'speedometer-outline',
    color: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
  hardaccelerationalert: {
    icon: 'flash-outline',
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  trip_updates: {
    icon: 'car-outline',
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  driver_arrival: {
    icon: 'location-outline',
    color: '#10B981',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  },
  payment_alerts: {
    icon: 'wallet-outline',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
  },
  promotions: {
    icon: 'pricetag-outline',
    color: '#EC4899',
    bg: '#FDF2F8',
    border: '#FBCFE8',
  },
};

const DEFAULT_CONFIG = {
  icon: 'notifications-outline',
  color: '#6B7280',
  bg: '#F9FAFB',
  border: '#E5E7EB',
};

const TripSettingsScreen = () => {
  const { goBack } = useStackScreenStore();
  const passengerNotificationPreferences = useCurrentRideInfoStore(s => s.passengerNotificationPreferences);
  const setPassengerNotificationPreferences = useCurrentRideInfoStore(s => s.setPassengerNotificationPreferences);
  const tripId = useCurrentRideInfoStore(s => s.tripId);

  const [localPrefs, setLocalPrefs] = useState(passengerNotificationPreferences || []);
  const [saving, setSaving] = useState(null); // stores the type being saved

  useEffect(() => {
    if (passengerNotificationPreferences) {
      setLocalPrefs(passengerNotificationPreferences);
    }
  }, [passengerNotificationPreferences]);

  const handleToggle = async (type) => {
    const updated = localPrefs.map(p =>
      p.type === type ? { ...p, disabled: !p.disabled } : p,
    );
    setLocalPrefs(updated);
    setPassengerNotificationPreferences(updated);
    setSaving(type);
    try {
      await updateNotificationPreferences(updated, tripId);
    } catch (e) {
      // revert on failure
      setLocalPrefs(localPrefs);
      setPassengerNotificationPreferences(localPrefs);
    } finally {
      setSaving(null);
    }
  };

  const prefs = localPrefs.length > 0 ? localPrefs : [];

  return (
    <View style={styles.container}>
      <NavBar withBg title="Trip Settings" onBackPress={goBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={18} color={colors.violet || '#7C3AED'} />
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Manage alerts you receive during this trip
        </Text>

        {prefs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="settings-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No preferences available for this trip</Text>
          </View>
        ) : (
          <View style={styles.prefList}>
            {prefs.map((pref, index) => {
              const cfg = TYPE_CONFIG[pref.type] || DEFAULT_CONFIG;
              const isEnabled = !pref.disabled;
              const isSaving = saving === pref.type;
              return (
                <View
                  key={pref.type}
                  style={[
                    styles.prefRow,
                    { backgroundColor: cfg.bg, borderColor: cfg.border },
                    index < prefs.length - 1 && styles.prefRowMargin,
                  ]}>
                  <View style={[styles.iconCircle, { backgroundColor: cfg.bg, borderColor: cfg.border, borderWidth: 1.5 }]}>
                    <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                  </View>
                  <View style={styles.prefTextWrap}>
                    <Text style={styles.prefName}>{pref.name}</Text>
                    <Text style={[styles.prefStatus, { color: isEnabled ? '#16A34A' : '#9CA3AF' }]}>
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                  {isSaving ? (
                    <ActivityIndicator size="small" color={cfg.color} />
                  ) : (
                    <Switch
                      value={isEnabled}
                      onValueChange={() => handleToggle(pref.type)}
                      trackColor={{ false: '#E5E7EB', true: cfg.color + '55' }}
                      thumbColor={isEnabled ? cfg.color : '#9CA3AF'}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            Changes apply to this trip and your account preferences.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: '#111827',
  },
  sectionSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    marginLeft: 26,
  },
  prefList: {
    gap: 10,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  prefRowMargin: {
    marginBottom: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTextWrap: {
    flex: 1,
  },
  prefName: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  prefStatus: {
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    marginTop: 20,
  },
  infoText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
});

export default TripSettingsScreen;
