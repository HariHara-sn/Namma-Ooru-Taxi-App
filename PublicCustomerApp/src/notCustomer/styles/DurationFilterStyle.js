import { StyleSheet } from "react-native";
import { colors, Fonts } from "../constants/constants";

export const durationFilterStyle = StyleSheet.create({
    container: {
        width: '100%',
        height: 30,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 10,
        backgroundColor: colors.white,
    },
    containerItems: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    containerItem: {
        width: 'max-content',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderRightWidth: 1,
        borderRightColor: colors.grey,
        gap: 5,
    },
    containerItemIcon: {
        width: 'max-content',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: 5,
        gap: 5,
    },
    containerItemLabel: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: colors.grey_dark,
    },
    containerItemActiveLabel: {
        color: colors.black,
        fontWeight: 500,
    },
    containerItemSpan: {
        display: 'none',
        width: '90%',
        height: 1,
        borderStyle: 'dotted',
        borderBottomWidth: 3,
        borderColor: colors.black,
    },
    containerItemAciveSpan: {
        display: 'block',
    }

});


