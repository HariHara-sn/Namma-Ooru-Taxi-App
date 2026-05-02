import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

/**
 * ImageWithBadge
 * Renders a primary image (e.g., vehicle) and an optional badge image (e.g., driver avatar)
 * Props:
 * - mainSource: Image source (local require or {uri})
 * - badgeSource: optional Image source for badge
 * - mainStyle: style for the main image
 * - badgeStyle: style for the badge image
 * - containerStyle: style for wrapper
 */
const ImageWithBadge = ({
  mainSource,
  badgeSource,
  mainStyle,
  badgeStyle,
  containerStyle,
  layout = 'side', // 'side' | 'overlay'
  badgeOverlayElement = null, // optional React element to render over badge (e.g., electric icon)
}) => {
  if (!mainSource && !badgeSource) return null;

  // normalize sources (handle string uri vs require)
  const normalizedMain = mainSource ? (typeof mainSource === 'string' ? { uri: mainSource } : mainSource) : null;
  const normalizedBadge = badgeSource ? (typeof badgeSource === 'string' ? { uri: badgeSource } : badgeSource) : null;

  if (layout === 'overlay') {
    return (
      <View style={[styles.wrapperOverlay, containerStyle]}>
        {normalizedMain && (
          <Image source={normalizedMain} style={[styles.mainImage, mainStyle]} />
        )}
        {normalizedBadge && (
          <Image source={normalizedBadge} style={[styles.badgeOverlay, badgeStyle]} />
        )}
      </View>
    );
  }

  // default: side layout (vehicle left, driver avatar right inside a wrapper)
  return (
    <View style={[styles.rowWrapper, containerStyle]}>
      {normalizedMain && (
        <Image source={normalizedMain} style={[styles.mainImage, mainStyle]} />
      )}

      {normalizedBadge && (
        <View style={styles.driverImgWrap}>
          {badgeOverlayElement}
          <Image source={normalizedBadge} style={[styles.driverImg, badgeStyle]} />
        </View>
      )}
    </View>
  );
};

ImageWithBadge.propTypes = {
  mainSource: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  badgeSource: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  mainStyle: PropTypes.object,
  badgeStyle: PropTypes.object,
  containerStyle: PropTypes.object,
  layout: PropTypes.oneOf(['side', 'overlay']),
  badgeOverlayElement: PropTypes.element,
};

ImageWithBadge.defaultProps = {
  mainSource: null,
  badgeSource: null,
  mainStyle: {},
  badgeStyle: {},
  containerStyle: {},
};

const styles = StyleSheet.create({
  rowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wrapperOverlay: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: 60,
    height: 60,
  },
  // side layout driver wrap (matches OnRideScreen pattern)
  driverImgWrap: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  driverImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  // overlay layout badge
  badgeOverlay: {
    position: 'absolute',
    right: -6,
    top: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
  },
});

export default ImageWithBadge;
