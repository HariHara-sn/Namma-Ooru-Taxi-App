import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { colors, Fonts } from '../../constants/constants';
import { useStackScreenStore } from '../../store/useStackScreenStore';

const SettingsDropdown = ({ visible, onClose, onDeleteAccount }) => {
  const { t } = useTranslation();
  const { setStackScreen } = useStackScreenStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleNotifications = () => {
    setStackScreen('NotificationScreen');
    onClose();
  };

  const handleDeleteAccount = () => {
    onDeleteAccount();
    onClose();
  };

  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <Animated.View
        style={[
          styles.dropdown,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* <TouchableOpacity
          style={styles.menuItem}
        //   onPress={handleNotifications}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.black} />
          <Text style={styles.menuText}>{t('notifications')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.grey} />
        </TouchableOpacity> */}

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger_red} />
          <Text style={[styles.menuText, { color: colors.danger_red }]}>
            {t('delete_account')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.grey} />
        </TouchableOpacity>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  dropdown: {
    position: 'absolute',
    top: 80,
    right: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: colors.black,
  },
  divider: {
    height: 1,
    backgroundColor: colors.grey_xlight,
    marginHorizontal: 16,
    marginVertical: 4,
  },
});

SettingsDropdown.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDeleteAccount: PropTypes.func.isRequired,
};

export default SettingsDropdown; 