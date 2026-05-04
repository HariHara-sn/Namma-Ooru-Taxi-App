import { StyleSheet } from 'react-native';
import { colors, Fonts } from '../../constants/constants';

const tripDetailIcon = {
    width: "20",
    height: "20"
}

const profileIcon = {
    width: "100%",
    height: "100%"
}

const TripSummaryStyle = StyleSheet.create({
    mapContainer: {
        height: 300,
        width: "100%",
    },
    map: {
        height: '100%',
        width: "100%",
    },
    container: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        paddingTop: 10,
        gap: 15
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 16,

    },
    headerText: {
        fontSize: 20,
        color: '#212121',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    headerDesc: {
        fontSize: 16,
        color: colors.grey_xxdark,
        marginTop: 5,
        textAlign: 'center'
    },
    headerTextContainer: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    dashedLine: {
        borderWidth: 1,
        borderColor: '#212121',
        borderStyle: 'dotted',
        borderBottomWidth: 0
    },
    dottedLine: {
        borderWidth: 1,
        borderStyle: 'dotted',
        width: 100,
        borderBottomWidth: 0
        // backgroundColor:'red'
    },
    tripId: {
        fontSize: 14,
        color: '#757575'
    },
    date: {
        fontSize: 16,
        marginTop: 8,
        fontWeight: 'bold',
    },
    locations: {
        // padding: 20,
        backgroundColor: '#fff'
    },
    location: {
        position: 'relative',
        paddingLeft: 20,
        marginLeft: 30,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.1)',
        borderStyle: 'dashed',
        paddingTop: 0,
        paddingBottom: 20,
    },
    statusBox: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginRight: 10,
        rowGap: 22
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    waypointBox: {
        position: 'relative',
        paddingLeft: 20,
        marginLeft: 30,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.1)',
        borderStyle: 'dashed',
        paddingTop: 0,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    marker: {
        width: 18,
        height: 18,
        position: 'absolute',
        left: -7.9, top: 0
    },
    yourLocationMarker: {
        width: 18,
        height: 18,
        position: 'absolute',
        left: -13, top: -1
    },
    threeDots: {
        position: 'absolute',
        top: 0,
        right: 0
    },
    markerContainer: {
        position: 'absolute',
        left: -10,
        top: 0,
        backgroundColor: '#4b1abf',
        height: 20,
        width: 20,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: "center"
    },
    markerContainerTwo: {
        position: 'absolute',
        left: -11,
        top: 0,
        height: 20,
        width: 20,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: "center"
    },
    StopCount: {
        position: 'absolute',
        left: -4.5,
        top: 2,
        fontWeight: '800',
        color: '#6f00ff',
        backgroundColor: 'transparent',
        fontSize: 12
    },
    MarkerCount: {
        position: 'absolute',
        left: -3,
        top: 1,
        fontSize: 10,
        fontWeight: '500',
        backgroundColor: 'transparent'
    },
    name: {
        color: "#616161",
        fontSize: 14,
    },
    time: {
        color: "#616161",
        fontSize: 14,
        marginTop: 5

    },
    address: {
        fontSize: 16,
        color: "black",
        // marginTop: 5,
    },
    nameInfo: {
        fontSize: 16,
        color: "black",
        fontWeight: '500'
    },
    locationDetails: {
        marginTop: 16,
    },
    tripDetails: {
        flexDirection: 'row',
        marginTop: 16,
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
        gap: 15
    },
    detailRow: {
        minWidth: 100,
        backgroundColor: 'rgba(0, 153, 255, 0.2)',
        padding: 10,
        borderRadius: 5,
        color: '#212121',
        justifyContent: 'flex-start',
        minHeight: 50,
        flexDirection: 'column',
        // alignItems: 'center',
    },
    detailLabel: {
        color: '#212121',
        flex: 1,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.dark,
        marginTop: 3

    },
    tripDetailIcon: {
        width: 20, // Set a fixed width for the icon
        height: 20, // Set a fixed height for the icon
        resizeMode: 'contain', // Ensure the image scales properly within the bounds
        marginRight: 10,
    },
    profile: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        paddingTop: 20,
    },
    profilePic: {
        width: 50,
        height: 50,
        borderRadius: 100,
        marginRight: 20
    },
    profileLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.dark,
        textAlign: 'center'
    },
    textArea: {
        height: 150,
        width: '100%',
        justifyContent: "flex-start",
        padding: 10,
        textAlignVertical: 'top', // This makes the placeholder and text appear at the top of the text area
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        borderRadius: 5,
        marginTop: 10
    },
    ratingContainer: {
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
    },
    submitButton: {
        padding: 12,
        backgroundColor: '#237b53',
        borderRadius: 8,
        alignItems: 'center',
        width: 144,
        height: 40,
        marginBottom: 20
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    homeButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#2c3e50',
        borderRadius: 8,
        alignItems: 'center',
        width: 160,
        height: 40,
        marginLeft: 'auto',
        marginRight: 'auto'
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    employeeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212121'
    },
    containerContent: {
        display: 'flex',
        flexDirection: 'column',
        paddingHorizontal: 15,
    },
    fareCard: {
        width: '100%',
        height: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        backgroundColor: colors.dark,
        borderRadius: 10,
    },
    fareCardLable: {
        fontFamily: Fonts.semi_bold,
        fontSize: 16,
        color: colors.white,
    },
    fareCardValueMain: {
        width: 'max-content',
        height: 'max-content',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    fareCardValueIcon: {
        fontFamily: Fonts.medium,
        fontSize: 20,
        color: colors.white,
    },
    fareCardValue: {
        fontFamily: Fonts.medium,
        fontSize: 28,
        color: colors.white,
    },
    paymentModeContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        paddingTop: 20,
        paddingBottom: 20,
    },
    paymentModeLabelMain: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    paymentModeValueMain: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 5
    },
    paymentModeLabel: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: colors.dark,
    },
    paymentModeLabel: {
        fontFamily: Fonts.regular,
        fontSize: 16,
        color: colors.dark,
    },
    paymentModeValue: {
        fontFamily: Fonts.semi_bold,
        fontSize: 18,
        color: colors.green,
    },
    paymentDetailsContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 30,
        paddingTop: 20,
        paddingBottom: 20,
    },
    paymentDetailsHeader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
    },
    paymentDetailsHeaderText: {
        fontSize: 18,
        color: colors.dark,
        fontFamily: Fonts.medium,
    },
    paymentDetailsItems: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
    },
    paymentDetailsItem: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        paddingLeft: 15,
        paddingRight: 15,
    },
    paymentDetailsItemLabel: {
        fontSize: 16,
        color: colors.grey_xxdark,
        fontFamily: Fonts.regular,
    },
    paymentDetailsItemValue: {
        fontSize: 16,
        color: colors.grey_xxdark,
        fontFamily: Fonts.semi_bold,
    },
    paymentDetailsItemTotalLabel: {
        fontSize: 18,
        color: colors.dark,
        fontFamily: Fonts.medium,
    },
    paymentDetailsItemTotalValue: {
        fontSize: 18,
        color: colors.dark,
        fontFamily: Fonts.medium,
    },
});

module.exports = { TripSummaryStyle, tripDetailIcon, profileIcon }


