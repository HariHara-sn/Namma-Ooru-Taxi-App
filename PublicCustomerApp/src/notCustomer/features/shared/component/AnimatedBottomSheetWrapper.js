import React, { useRef, useEffect } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
  Modal,
} from 'react-native';
import Icons from 'react-native-vector-icons/MaterialIcons';
import PropTypes from 'prop-types';
import { colors } from '../../../constants/constants';

const { height } = Dimensions.get('window');

export default function AnimatedBottomSheetWrapper({ children, onClose, zIndex = false, visible = true }) {
    const bounceValue = useRef(new Animated.Value(height)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
  
    useEffect(() => {
      Animated.parallel([
        Animated.spring(bounceValue, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 3,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);
  
    const handleClose = () => {
      Animated.parallel([
        Animated.timing(bounceValue, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onClose) onClose();
      });
    };
  
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
      <View style={[styles.wrapper,{zIndex:zIndex ? zIndex : 9998}]}> 
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.bottomSheetWrapper,
            {
              transform: [{ translateY: bounceValue }],
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButtonContainer} onPress={handleClose}>
            <View style={styles.closeButton}>
              <Icons name="close" size={24} color={colors.black} />
            </View>
          </TouchableOpacity>

          <View style={styles.bottomSheet}>
            <View style={styles.contentContainer}>
          
              {children}
            </View>
          </View>

        </Animated.View>
      </View>
      </Modal>
    );
  }

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 9998,
    position: 'absolute',
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
    pointerEvents: 'auto',
  },
  bottomSheetWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10000,
  },
  bottomSheet: {
 
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
   
  },
  closeButtonContainer: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 20,
  },
  contentContainer: {
    paddingTop: 20,
    minHeight: 200,
    position: 'relative',
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});

AnimatedBottomSheetWrapper.propTypes = {
  children: PropTypes.node,
  onClose: PropTypes.func,
  zIndex: PropTypes.number,
  visible: PropTypes.bool,
};
