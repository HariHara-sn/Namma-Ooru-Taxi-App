/* eslint-disable react/display-name */
import React, { useRef } from 'react';
import { View, KeyboardAvoidingView, Text } from 'react-native';
import { Modalize } from 'react-native-modalize';
import PropTypes from 'prop-types';

const BottomSheet = React.memo(({ children, minHeight, maxHeight, panGestureEnabled = true, reference = null, HeaderComponent = null }) => {
  const modalizeRef = reference || useRef(null);
  return (
    <Modalize
      ref={modalizeRef}
      alwaysOpen={minHeight || 300}
      childrenStyle={{ height: maxHeight || 700, }}
      adjustToContentHeight={false}
      handlePosition="inside"
      withOverlay={true}
      panGestureEnabled={panGestureEnabled}
      withHandle={panGestureEnabled}
      HeaderComponent={HeaderComponent ? HeaderComponent : <></>}
    >
      <KeyboardAvoidingView behavior={null}>
        <View style={{ paddingTop: 20 }}>{children}</View>
      </KeyboardAvoidingView>
    </Modalize>
  );
});

export default BottomSheet;

BottomSheet.propTypes = {
  children: PropTypes.any,
  minHeight: PropTypes.number,
  maxHeight: PropTypes.number
};

BottomSheet.defaultProps = {
  children: <></>,
  minHeight: 300,
  maxHeight: 700
};
