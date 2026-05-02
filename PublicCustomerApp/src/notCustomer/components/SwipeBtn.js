import React, { useState } from "react";
import { View, Text, StyleSheet, PanResponder, Animated, Dimensions, Vibration } from "react-native";
import PropTypes from 'prop-types';
import { Fonts } from "../constants/constants";


const SwipeBtn = ({ name = "SLIDE TO CANCEL", onHandleSwipeEnd }) => {
    const [translateX] = useState(new Animated.Value(0));
    const screenWidth = Dimensions.get('window').width;
    const trackWidth = screenWidth * 0.9;
    const thumbWidth = 56;
    const maxTranslateX = trackWidth - thumbWidth;
    const threshold = 0.55 * trackWidth;

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
        onPanResponderMove: (_, gestureState) => {
            if (gestureState.dx > 0) {
                const clampedDx = Math.min(gestureState.dx, maxTranslateX);
                translateX.setValue(clampedDx);
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dx > threshold) {
                Animated.timing(translateX, {
                    toValue: maxTranslateX,
                    duration: 150,
                    useNativeDriver: true,
                }).start(() => {
                    Vibration.vibrate();
                    onHandleSwipeEnd && onHandleSwipeEnd();
                    translateX.setValue(0);
                });
            } else {
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            }
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.track}>
                <Animated.View
                    style={[
                        styles.thumb,
                        { transform: [{ translateX }] },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.thumbCircle}>
                        <Text style={styles.xIcon}>×</Text>
                    </View>
                </Animated.View>
                <Text style={styles.text}>{name}</Text>
            </View>
        </View>
    );
};

SwipeBtn.propTypes = {
    name: PropTypes.string,
    onHandleSwipeEnd: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    track: {
        width: '90%',
        height: 56,
        backgroundColor: '#ff6060',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    thumb: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        width: 56,
        height: 56,
    },
    thumbCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    xIcon: {
        color: '#FF6B6B',
        fontSize: 28,
        fontWeight: 'bold',
        lineHeight: 32,
    },
    text: {
        color: '#fff',
        fontFamily: Fonts.regular,
        fontSize: 14,
        letterSpacing: 1,
        textAlign: 'center',
        zIndex: 1,
        width: '100%',
        textTransform: 'uppercase',
    },
});

export default SwipeBtn;