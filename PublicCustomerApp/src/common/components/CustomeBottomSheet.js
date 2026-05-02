import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView , BottomSheetBackdrop, BottomSheetHandle, BottomSheetFlatList, BottomSheetScrollView} from '@gorhom/bottom-sheet';

const CustomeBottomSheet = (props) => {
  const {children, customeHandle, showFlatList, data, keyExtractor, renderItem, flatlistStyles, useScrollView = false, snapPoints = ['30%', '90%']} = props;
  const bottomSheetRef = useRef(null);

  const handleSheetChanges = useCallback((index) => {
    // console.log('handleSheetChanges', index);
  }, []);

  const renderBackdrop = useCallback(
		(props) => (
			<BottomSheetBackdrop
				{...props}
				disappearsOnIndex={1}
				appearsOnIndex={2}
			/>
		),
		[]
	);

  const renderHandle = useCallback(
    props => (
      <BottomSheetHandle {...props} >
       {customeHandle}
      </BottomSheetHandle>
    ),
    [customeHandle]
  );

  // renders
  return (
      <BottomSheet
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleComponent={renderHandle}
        enableDynamicSizing={true}
      >
        {useScrollView ? (
          <BottomSheetScrollView 
            style={styles.contentContainer}
            contentContainerStyle={{flexGrow: 1}}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={styles.contentContainer}>
            {children}
          </BottomSheetView>
        )}
          {showFlatList && (
          <BottomSheetFlatList
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={flatlistStyles}
            initialNumToRender={10}
          />
        )}
      </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex:1,
    borderTopLeftRadius:20,
    borderTopRightRadius:20,
  },
});

export default CustomeBottomSheet;