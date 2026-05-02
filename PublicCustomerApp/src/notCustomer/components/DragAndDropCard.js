import React, {useRef, useState, useMemo} from 'react';
import {StyleSheet, PanResponder, Animated} from 'react-native';
import {height} from '../utils/Utils';
import {colors} from '../constants/constants';

const DragAndDropCard = ({
  index,
  onDrag,
  onDragEnd,
  children,
  length,
  topOffset,
  itemHeight,
}) => {
  // Create a ref to store the position of the card
  const position = useRef(new Animated.ValueXY()).current;

  const [dragging, setDragging] = useState(false);

  const calculateDropIndex = (
    gestureState,
    itemHeight,
    dataLength,
    topOffset = 0,
  ) => {
    const dragY = gestureState.moveY - topOffset;
    let estimatedIndex = Math.floor(dragY / itemHeight);

    estimatedIndex = Math.max(0, Math.min(estimatedIndex, dataLength - 1));

    if (estimatedIndex === 0 && gestureState.dy < 0) {
      return 0;
    }

    if (gestureState.dy > itemHeight / 2 && estimatedIndex < dataLength - 1) {
      estimatedIndex += 1;
    } else if (gestureState.dy < -itemHeight / 2 && estimatedIndex > 0) {
      estimatedIndex -= 1;
    }

    return estimatedIndex;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event(
          [
            null,
            {
              dx: position.x,
              dy: position.y,
            },
          ],
          {useNativeDriver: false},
        ),
        onPanResponderGrant: () => {
          setDragging(true);
        },
        onPanResponderRelease: (e, gestureState) => {
          setDragging(false);
          const dropIndex = calculateDropIndex(
            gestureState,
            itemHeight,
            length,
            topOffset,
          );
          const movedSlightly = Math.abs(gestureState.dy) >= 10;
          onDragEnd(index, dropIndex, movedSlightly);

          Animated.spring(position, {
            toValue: {x: 0, y: 0},
            useNativeDriver: false,
          }).start();
        },
      }),
    [index, onDragEnd, length, itemHeight, topOffset],
  );

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: position.getTranslateTransform(),
          opacity: dragging ? 0.4 : 1,
          zIndex: dragging ? 1 : 0,
        },
      ]}
      // {...panResponder.panHandlers}
      >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginTop: 20,
  },
  card: {
    borderRadius: 5,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    backgroundColor: colors.white,
  },
});
export default DragAndDropCard;
