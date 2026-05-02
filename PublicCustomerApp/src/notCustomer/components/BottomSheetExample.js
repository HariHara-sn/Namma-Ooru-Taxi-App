import React, { useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheetWrapper from './BottomSheetWrapper';

const BottomSheetExample = () => {
  // ref
  const bottomSheetRef = useRef(null);

  // variables
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  // callbacks
  const handleSheetChanges = useCallback((index) => {
  
  }, []);

  const handlePresentPress = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleDismissPress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handlePresentPress}>
        <Text style={styles.buttonText}>Present Bottom Sheet</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleDismissPress}>
        <Text style={styles.buttonText}>Dismiss Bottom Sheet</Text>
      </TouchableOpacity>

      <BottomSheetWrapper
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        handleIndicatorStyle={{
          backgroundColor: '#DEDEDE',
          width: 50,
          height: 4,
        }}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Bottom Sheet Example</Text>
          <Text style={styles.description}>
            This is an example of using the @gorhom/bottom-sheet package with a custom wrapper.
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Smooth animations</Text>
            <Text style={styles.featureItem}>• Gesture handling</Text>
            <Text style={styles.featureItem}>• Multiple snap points</Text>
            <Text style={styles.featureItem}>• Customizable styling</Text>
          </View>
        </View>
      </BottomSheetWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1C1C1E',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    color: '#3C3C43',
    lineHeight: 24,
  },
  featureList: {
    marginTop: 16,
  },
  featureItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#3C3C43',
  },
});

export default BottomSheetExample; 