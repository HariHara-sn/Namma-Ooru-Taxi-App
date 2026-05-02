import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, Fonts } from '../../../constants/constants';

const BackgroundLocationPreInfoModal = ({ onClose, onProceed }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Icon name="security" size={28} color={colors.black} />
          <Text style={styles.title}>Enable background location for SOS</Text>
        </View>
        <Text style={styles.description}>
          Enabling background location lets us keep updating and share your live
          location with your emergency contacts and our support team even if the
          app is closed.
        </Text>
        <View style={styles.bulletRow}>
          <Icon name="check-circle" size={20} color="#04713B" />
          <Text style={styles.bulletText}>Share live location during SOS</Text>
        </View>
        <View style={styles.bulletRow}>
          <Icon name="check-circle" size={20} color="#04713B" />
          <Text style={styles.bulletText}>Works even when the app is closed</Text>
        </View>
        <View style={styles.bulletRow}>
          <Icon name="check-circle" size={20} color="#04713B" />
          <Text style={styles.bulletText}>You can disable this anytime</Text>
        </View>
        <Text style={styles.smallPrint}>
          You can turn off background location later from app settings or your
          device settings.
        </Text>

        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Not now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={onProceed} activeOpacity={0.9}>
            <Text style={styles.primaryText}>Enable & Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    color: colors.black,
    fontFamily: Fonts.medium,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.grey_xxdark,
    fontFamily: Fonts.regular,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  bulletText: {
    fontSize: 14,
    color: colors.black,
    fontFamily: Fonts.regular,
    flexShrink: 1,
  },
  smallPrint: {
    fontSize: 12,
    color: colors.grey_xxdark,
    fontFamily: Fonts.regular,
    marginTop: 12,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  cancelText: {
    color: colors.black,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#04713B',
  },
  primaryText: {
    color: '#fff',
    fontFamily: Fonts.medium,
    fontSize: 14,
  },
});

export default BackgroundLocationPreInfoModal;


