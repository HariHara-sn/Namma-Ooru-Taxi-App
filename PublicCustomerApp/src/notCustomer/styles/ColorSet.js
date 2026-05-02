import { Colors } from 'react-native/Libraries/NewAppScreen';
import { StyleSheet } from 'react-native';

const genericColorSet = {
    _white: 'white',
    _black: 'black',
    _grey: 'grey',
    _primary: '#1e88e5',
    _secondary: '#ff9800',
};

const lightThemeStyles = StyleSheet.create({
    ...genericColorSet,
    white: Colors.white,
    black: Colors.black,
});

const darkThemeStyles = StyleSheet.create({
    ...genericColorSet,
    white: Colors.black,
    black: Colors.white,
});

module.exports = {
    lightThemeStyles,
    darkThemeStyles,
};