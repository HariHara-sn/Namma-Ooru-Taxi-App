import React, { useMemo, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import PropTypes from 'prop-types';

const BottomSheetWrapper = forwardRef(({
  children,
  snapPoints = ['25%', '50%', '90%'],
  index = 1,
  enablePanDownToClose = false,
  enableOverDrag = true,
  enableScroll = false,
  enableDynamicSizing = false,
  handleIndicatorStyle,
  handleComponent,
  backdropComponent,
  backdrop = false,
  style,
  isLoading = false,
  ...props
}, ref) => {
  const snapPointsArray = useMemo(() => snapPoints, [snapPoints]);

  // Clamp the provided index into the valid range [-1, snapPointsArray.length - 1]
  const clampedIndex = useMemo(() => {
    const maxIndex = snapPointsArray.length - 1;
    if (typeof index !== 'number' || Number.isNaN(index)) return 0;
    if (snapPointsArray.length === 0) return -1; // nothing to show
    if (index < -1) return -1;
    if (index > maxIndex) {
      if (__DEV__) {
        // Warn in development to surface misconfiguration early
        // eslint-disable-next-line no-console
        console.warn(`BottomSheetWrapper: index ${index} > max allowed ${maxIndex}. Clamping to ${maxIndex}. (snapPoints length=${snapPointsArray.length})`);
      }
      return maxIndex;
    }
    return index;
  }, [index, snapPointsArray]);

  const shouldRenderScrollView = enableScroll && !isLoading && children;

  return (
    <BottomSheet
      ref={ref}
      index={clampedIndex}
      snapPoints={snapPointsArray}
      enablePanDownToClose={enablePanDownToClose}
      enableOverDrag={enableOverDrag}
      enableScroll={shouldRenderScrollView}
      enableDynamicSizing={enableDynamicSizing}
      handleIndicatorStyle={handleIndicatorStyle}
      handleComponent={handleComponent}
      backdropComponent={backdrop ? (backdropComponent || ((backdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          opacity={0.5}
        />
      ))) : undefined}
      style={[styles.bottomSheet, style]}
      {...props}
    >
      {shouldRenderScrollView ? (
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <View style={styles.contentContainer}>
          {children}
        </View>
      )}
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    minHeight: 200, // Ensure minimum height for content
  },
  scrollContent: {
   
    paddingHorizontal: 10,
    flexGrow: 1,
    backgroundColor: 'white',
    minHeight: 200, // Ensure minimum height for scroll content
  },
});

BottomSheetWrapper.propTypes = {
  children: PropTypes.node,
  snapPoints: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  index: PropTypes.number,
  enablePanDownToClose: PropTypes.bool,
  enableOverDrag: PropTypes.bool,
  enableScroll: PropTypes.bool,
  enableDynamicSizing: PropTypes.bool,
  handleIndicatorStyle: PropTypes.object,
  handleComponent: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  setBottomSheetScrollToBottom: PropTypes.func,
  isLoading: PropTypes.bool,
  backdrop: PropTypes.bool,
  backdropComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
};

BottomSheetWrapper.defaultProps = {
  snapPoints: ['25%', '50%', '90%'],
  index: 1,
  enablePanDownToClose: false,
  enableOverDrag: true,
  enableScroll: false,
  enableDynamicSizing: false,
  isLoading: false,
  backdrop: false,
};

BottomSheetWrapper.displayName = 'BottomSheetWrapper';

export default BottomSheetWrapper;
