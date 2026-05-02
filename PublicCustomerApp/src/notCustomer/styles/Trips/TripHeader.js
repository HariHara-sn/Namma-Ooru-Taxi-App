import { StyleSheet } from 'react-native';
import { colors, Fonts } from '../../constants/constants';

const TripHeaderStyles = StyleSheet.create({
    text: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold'
    },
    container: {
        width: '100%',
        zIndex: 3,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignSelf: 'center',
    },
    leftIcon: {
        width: '20%',
        padding: 10,
        alignItems: 'center',
    },
    leftBtn: {
        borderRadius: 50,
        backgroundColor: colors.white,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        padding: 6
    },

})

module.exports = { TripHeaderStyles }