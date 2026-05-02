import React from 'react';
import PropTypes from 'prop-types';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const FallbackComponent = ({ error, resetError }) => {
  const errorMessage = error?.toString?.() || 'Unknown error';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>An unexpected error occurred.</Text>

        <ScrollView style={styles.errorContainer} contentContainerStyle={styles.errorContent}>
          <Text selectable style={styles.errorText}>
            {errorMessage}
          </Text>
        </ScrollView>

        <TouchableOpacity accessibilityRole="button" onPress={resetError} style={styles.button}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorContainer: {
    maxHeight: 160,
    alignSelf: 'stretch',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  errorContent: {
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#374151',
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#111827',
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FallbackComponent;

FallbackComponent.propTypes = {
  error: PropTypes.instanceOf(Error).isRequired,
  resetError: PropTypes.func.isRequired,
};

