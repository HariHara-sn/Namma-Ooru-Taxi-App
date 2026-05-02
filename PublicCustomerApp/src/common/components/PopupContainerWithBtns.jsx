import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import React, { useTransition } from 'react';
import { getRedirection } from "react-native-translation"
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Fonts } from '../constants/constants';
import { useTranslation } from 'react-i18next';



const PopupContainerWithBtns = ({ handleOnPress, handleCancel, children }) => {
    const {t} = useTranslation()


    return (
        <View style={[styles.container,{}]}>
            <View style={styles.contentBox}>
                <View style={styles.lockContainer}>
                    <View style={styles.lock}>
                        <MaterialCommunityIcons name='map-marker-alert' color={Colors.periwinkle} size={35} />
                    </View>
                </View>
                <View style={{ paddingHorizontal: 15 }}>
                    {
                        children
                    }
                </View>

                <TouchableOpacity style={styles.acceptBtn} onPress={handleOnPress}>
                    <Text style={styles.acceptBtnText}>{"Proceed"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} >
                    <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
};

export default PopupContainerWithBtns;

const styles = StyleSheet.create({
    banner: {
        marginVertical: 20,
    },

    lock: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 50,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },

    lockContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
        top: -50,
        zIndex: 5,
    },

    shortDesc: {
        color: 'black',
        textAlign: 'center',
        fontSize: 12,
        marginVertical: 5,
        fontFamily: Fonts.regular,
    },

    title: {
        color: 'black',
        fontSize: 15,
        fontFamily: Fonts.semi_bold,
        textAlign: 'center',
        marginBottom: 10,
    },

    container: {
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },

    contentBox: {
        backgroundColor: '#fff',
        borderRadius: 10,
        width: '90%',
        paddingVertical: 20,
        // paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
        position: 'relative',
        zIndex: 10,
    },
    topBox: {
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomBox: {
        padding: 10,
    },
    desc: {
        color: '#212121',
        textAlign: 'center',
        fontSize: 14,
        marginVertical: 5,
        fontFamily: Fonts.light,
    },
    acceptBtn: {
        backgroundColor: Colors.periwinkle,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        padding: 10,
        marginHorizontal: 30,
        marginVertical: 10,
        flexDirection: 'row',
        gap: 10,
    },
    acceptBtnText: {
        color: '#fff',
        fontFamily: Fonts.medium,
        textAlign: "center"
    },
    cancelBtnText: {
        color: 'red',
        textAlign: 'center',
        fontFamily: Fonts.light,
    },
    controls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
    },
    yesbtn: {
        backgroundColor: 'green',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    noBtn: {
        backgroundColor: 'red',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
    },
    btnContainer: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        marginVertical: 20
    },
});
