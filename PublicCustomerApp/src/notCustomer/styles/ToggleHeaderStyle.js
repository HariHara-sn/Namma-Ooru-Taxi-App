import { StyleSheet } from "react-native";
import { colors, Fonts } from "../constants/constants";

export const toggleHeaderStyle = StyleSheet.create({
    container: {
        width: '100%',
        height: 40,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: colors.white,
    },
    containerItems: {
        width: 'max-content',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.grey,
        borderRadius: 16,
    },
    containerItem: {
        width: 'max-content',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: 'transparent',
        paddingHorizontal: 25,
    },
    containerItemLabel: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: colors.grey_dark,
    },

    containerItemActive: {
        backgroundColor: colors.blue_xxdark,
    },
    containerItemActiveLabel: {
        color: colors.white,
    },

});
