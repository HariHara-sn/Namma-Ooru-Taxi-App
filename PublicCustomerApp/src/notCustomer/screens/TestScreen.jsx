import React from 'react';
import { SafeAreaView, View, StyleSheet, useWindowDimensions } from 'react-native';
import AdaptiveText from '../components/Common/AdaptiveText';
import { Fonts, colors } from '../constants/constants';

const TestScreen = () => {
  const { height, width } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AdaptiveText style={styles.title}>Device Metrics</AdaptiveText>
        <View style={styles.metricRow}>
          <AdaptiveText style={styles.metricLabel}>Screen Width</AdaptiveText>
          <AdaptiveText style={styles.metricValue}>{width} px</AdaptiveText>
        </View>
        <View style={styles.metricRow}>
          <AdaptiveText style={styles.metricLabel}>Screen Height</AdaptiveText>
          <AdaptiveText style={styles.metricValue}>{height} px</AdaptiveText>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: colors.white,
  },
  title: {
    fontFamily: Fonts.semi_bold,
    fontSize: 20,
    marginBottom: 24,
    color: colors.black,
  },
  metricRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.grey_light,
  },
  metricLabel: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: colors.grey_xxdark,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: colors.black,
  },
});

export default TestScreen;
