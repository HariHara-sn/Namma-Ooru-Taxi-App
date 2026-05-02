import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/constants';

const CustomToggleButton = ({ isToggled, setIsToggled }) => {
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animation, {
            toValue: isToggled ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isToggled, animation]);

    const handleToggle = () => {
        setIsToggled((previousState) => !previousState);
    };

    const togglevalues = [2, 32] 

    const translateX = animation.interpolate({
        inputRange: [0, 1],
        outputRange: togglevalues, // Adjust based on thumb size and track size
    });

    const trackColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['#767577', Colors.periwinkle],
    });

    return (
        <TouchableOpacity style={styles.toggleButton} onPress={handleToggle}>
            <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
                <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    track: {
        width: 56,
        height: 25,
        borderRadius: 15,
        justifyContent: 'center',
        padding: 2,
    },
    thumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#f4f3f4',
        position: 'absolute',
    },
});

export default CustomToggleButton;
