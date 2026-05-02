import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, Fonts } from '../../../constants/constants';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SupportSection = ({ onPress }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Icon name="support-agent" size={20} color={colors.green} style={{ marginRight: 8 }} />
        <Text style={styles.text}>{t('get_help_from_support')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: colors.green,
  },
});

export default SupportSection; 