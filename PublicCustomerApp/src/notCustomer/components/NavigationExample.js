import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStackScreenStore } from '../store/useStackScreenStore';

const NavigationExample = () => {
  const { setStackScreen, goBack, getCurrentScreen } = useStackScreenStore();
  const currentScreen = getCurrentScreen();

  const navigateWithParams = () => {
    setStackScreen('SelectedVehicle', { 
      vehicleId: 42, 
      mode: 'edit',
      vehicleData: {
        name: 'Toyota Camry',
        color: 'Silver',
        plateNumber: 'ABC123'
      }
    });
  };

  const navigateToSearch = () => {
    setStackScreen('SearchLocationScreen', {
      searchType: 'pickup',
      initialQuery: 'Current Location'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Navigation Example</Text>
      
      <Text style={styles.currentScreen}>
        Current Screen: {currentScreen.name}
      </Text>
      
      {currentScreen.params && (
        <Text style={styles.params}>
          Params: {JSON.stringify(currentScreen.params, null, 2)}
        </Text>
      )}

      <TouchableOpacity 
        style={styles.button} 
        onPress={navigateWithParams}
      >
        <Text style={styles.buttonText}>
          Navigate to SelectedVehicle with Params
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={navigateToSearch}
      >
        <Text style={styles.buttonText}>
          Navigate to SearchLocationScreen with Params
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={goBack}
      >
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  currentScreen: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  params: {
    fontSize: 14,
    marginBottom: 20,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NavigationExample; 