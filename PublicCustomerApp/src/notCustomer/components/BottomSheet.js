/* eslint-disable react/display-name */
import React, { useRef } from 'react';
import { View, KeyboardAvoidingView, Dimensions, StyleSheet, Text } from 'react-native';
import { Modalize } from 'react-native-modalize';
import { height } from '../utils/Utils';

const BottomSheet = React.memo(({ children, minHeight, maxHeight, panGestureEnabled = true, reference = null, HeaderComponent = null }) => {
  const modalizeRef = reference || useRef(null);
  const screenHeight = Dimensions.get('window').height;

  const renderContent = (content) => {
    if (content === null || content === undefined) return null;
    if (typeof content === 'string' || typeof content === 'number') {
      return <Text>{content}</Text>;
    }
    return content;
  };

  return (
  
      <Modalize
        ref={modalizeRef}
        modalStyle={styles.modalShadow}
        alwaysOpen={minHeight || 300}
        childrenStyle={{ height: minHeight || 300 }}
        modalHeight={maxHeight || screenHeight}
        adjustToContentHeight={false}
        handlePosition="inside"
        withOverlay={true}
        panGestureEnabled={panGestureEnabled}
        withHandle={panGestureEnabled}
        disableScrollIfPossible={true}
        HeaderComponent={<View style={styles.headerContainer}>{renderContent(HeaderComponent)}</View>}
      >
        <KeyboardAvoidingView behavior={null}>
          <View style={{ paddingTop: 20 }}>{renderContent(children)}</View>
        </KeyboardAvoidingView>
      </Modalize>
  
  );
});
const styles = StyleSheet.create({
  modalShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 20,
    borderRadius: 16,
    
    backgroundColor: '#fff',
  },
  
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      top: -height * 0.04,
      zIndex: 0,
      left:10,
     
    },
  
});
export default BottomSheet;
