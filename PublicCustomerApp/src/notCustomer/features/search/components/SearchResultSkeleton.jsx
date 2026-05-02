import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import PropTypes from 'prop-types';

const SearchResultSkeleton = ({ count = 6 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderSkeletonItem = (index) => {
    // Alternate between different item types for variety
    const isFastMatch = index % 3 === 0;
    const hasSecondaryText = index % 2 === 0;

    return (
      <View key={index} style={styles.item}>
        <View style={styles.leftContent}>
          {(
            // Regular search result skeleton
            <>
              <Animated.View style={[styles.skeletonPrimaryText, { opacity }]} />
              <Animated.View style={[styles.skeletonSubText, { opacity }]} />
            </>
          )}
        </View>
        
        <View style={styles.rightContent}>
          <Animated.View style={[styles.skeletonCategory, { opacity }]} />
          <Animated.View style={[styles.skeletonDistance, { opacity }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => renderSkeletonItem(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    padding: 10,
    minHeight:70,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  
    borderBottomColor: "#ccc",
    flexDirection: "row",
    alignItems:"center",
    width: "100%",
  },
  leftContent: {
    flex: 1,
    width: "80%",
  },
  rightContent: {
    width: "20%",
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skeletonPrimaryText: {
    width: '85%',
    height: 17,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonSecondaryText: {
    width: '70%',
    height: 17,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginLeft: 8,
  },
  skeletonSubText: {
    width: '60%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 2,
  },
  skeletonCategory: {
    width: 50,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 2,
  },
  skeletonDistance: {
    width: 40,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonIcon: {
    width: 22,
    height: 22,
    backgroundColor: '#E5E7EB',
    borderRadius: 11,
  },
  secondaryItemView: {
    flexDirection: "row",
    paddingVertical: 10,
    left: 10,
    alignItems: 'center',
  },
});

SearchResultSkeleton.propTypes = {
  count: PropTypes.number,
};

export default SearchResultSkeleton; 