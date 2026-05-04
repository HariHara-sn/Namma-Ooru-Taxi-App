import { StyleSheet } from "react-native";
import { colors, Fonts } from "../constants/constants";

export const yourRidesStyles = StyleSheet.create({
    mainContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: colors.white,
        gap: 10,
        paddingTop: 10,
    },
    ridesContainerItems: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        paddingHorizontal: 10,
    },
    ridesContainerItemFareContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: 5,
        alignItems: 'baseline',
    },
    ridesContainerItem: {
        width: '100%',
        minHeight: 100,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 10,
        paddingLeft: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.grey_xdark,
     
        gap: 10,
    },
    ridesContainerItemLeft: {
        flex:2,
        display: 'flex',
        flexDirection: 'column',
        gap: 15,
        justifyContent: 'space-between',
      
        height: '100%',
      
    },
    ridesContainerItemRight: {
        flex:1,
        display: 'flex',
        flexDirection: 'column',
       
    },
    ridesContainerItemImgs: {
        position: 'relative',

    },
    ridesContainerItemVehicleImg: {
        width: 120,
        height: 80,
        resizeMode: 'contain',
        marginRight: 10
    },
    ridesContainerItemDriverImg: {
        position: 'absolute',
        right: 0,
        bottom: 10,
        zIndex: 1,
        width: 50,
        height: 50,
        borderRadius: 1000,
        borderWidth: 1,
        borderColor: colors.white,
    },
    ridesContainerItemTitle: {
        fontFamily: Fonts.medium,
        fontSize: 16,
        marginBottom: 5,

        color: colors.black,
    },
    ridesContainerItemDesc: {
        fontFamily: Fonts.regular,
        fontSize: 12,
        color: colors.grey_xxdark,
        width: '90%',
    },
    ridesContainerItemFare: {
        fontFamily: Fonts.medium,
        fontSize: 16,
        color: colors.dark,
       
    },
    ridesContainerItemStatus: {
        fontFamily: Fonts.regular,
        fontSize: 12,
        color: colors.grey_xxdark,
    },
});


