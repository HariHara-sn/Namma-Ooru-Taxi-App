import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal } from 'react-native'
import React, { useState } from 'react'
import { useStackScreenStore } from '../../common/store/useStackScreenStore'
import FullScreenLoader from '../../common/loaders/FullScreenLoader'
import usePublicDriverStore from '../store/usePublicDriverStore'
import useUserStore from '../../common/store/useUserStore'
import APIRequest from '../../common/APIRequest'
import { showNotification } from '../../common/components/Alerts/showNotification'
import { Colors, colors, Fonts } from '../../common/constants/constants'
import { moderateScale, scale, verticalScale } from '../../common/utils/scalingutils'
import { useTranslation } from 'react-i18next'

const VehicleDetails = () => {
    const {t} = useTranslation()
    const { vehicleInfo, setVehicleInfo } = usePublicDriverStore()
    const { userInfo } = useUserStore()
    const {setStackScreen} = useStackScreenStore()
    const [loading, setLoading] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    
    const handleLogout = async () => {
        setLoading(true)
        const url = `/publicrides/driver/v2/logoutFromVehicle`
        const api = new APIRequest()
        try {
            const response = await api.request(
                url,
                'POST',
                {},
                userInfo?.token,
            )
            if (response.success) {
                showNotification(
                    response?.message || 'Logged out from vehicle',
                    t('pls_try_later'),
                    'success',
                )
                setVehicleInfo(null)
                setStackScreen('DriverAskVehicle') // force to vehicle selection
            } else {
                showNotification(
                    response?.message || 'Failed to logout from vehicle',
                    t('pls_try_later'),
                    'danger',
                )
            }
        } catch (error) {
            console.log(error, 'Error logging out')
            showNotification(
                error?.message || 'Network request failed',
                t('pls_try_later'),
                'danger',
            )
        }
        setLoading(false)
    }

    const confirmLogout = () => {
        setShowLogoutModal(false)
        handleLogout()
    }

    const vehicleDetails = [
        {
            label: 'Vehicle Type',
            value: vehicleInfo?.type || 'Not Available',
            // icon: <VehicleDetailsIcon width={20} height={20} />
        },
        {
            label: 'Make',
            value: vehicleInfo?.make || 'Not Available',
            // icon: <CarIcon width={20} height={20} />
        },
        {
            label: 'Model',
            value: vehicleInfo?.model || 'Not Available',
            // icon: <CarIcon width={20} height={20} />
        },
        {
            label: 'Color',
            value: vehicleInfo?.color || 'Not Available',
            // icon: <CarIcon width={20} height={20} />
        },
        {
            label: 'Year',
            value: vehicleInfo?.year || 'Not Available',
            // icon: <CarIcon width={20} height={20} />
        },
        {
            label: 'Registration Number',
            value: vehicleInfo?.regNo || 'Not Available',
            // icon: <CarIcon width={20} height={20} />
        }
    ]

    return (
        <View style={styles.container}>
            {loading && <FullScreenLoader />}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{t('vehicle_info')}</Text>
                    <Text style={styles.headerSubtitle}>{t('logged_in_vehicle_details')}</Text>
                </View>

                {/* Vehicle Details Card */}
                <View style={styles.detailsCard}>
                    {vehicleDetails.map((detail, index) => (
                        <View key={index} style={styles.detailRow}>
                            <View style={styles.detailLeft}>
                                <View style={styles.iconContainer}>
                                    {/* {detail.icon} */}
                                </View>
                                <Text style={styles.detailLabel}>{detail.label}</Text>
                            </View>
                            <Text style={styles.detailValue}>{detail.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => setShowLogoutModal(true)}
                >   
                    <View style={styles.logoutContent}>
                        {/* <LogoutIcon width={20} height={20} /> */}
                        <Text style={styles.logoutText}>{t('logout_from_vehicle')}</Text>
                    </View>
                </TouchableOpacity>

                {/* Logout Confirmation Modal */}
                <Modal
                    visible={showLogoutModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowLogoutModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{t('are_you_sure')}</Text>
                            <Text style={styles.modalMessage}>{t('are_you_sure_logout') || 'Are you sure you want to logout from this vehicle? You must login to another available vehicle to take trips.'}</Text>
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setShowLogoutModal(false)}>
                                    <Text style={styles.modalButtonTextCancel}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalButtonConfirm} onPress={confirmLogout}>
                                    <Text style={styles.modalButtonTextConfirm}>{t('logout')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    )
}

export default VehicleDetails

const styles = StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: Colors.white,
            borderRadius: 12,
            padding: 24,
            width: '80%',
            alignItems: 'center',
            shadowColor: Colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 8,
        },
        modalTitle: {
            fontFamily: Fonts.bold,
            fontSize: moderateScale(18),
            color: Colors.black,
            marginBottom: 12,
        },
        modalMessage: {
            fontFamily: Fonts.regular,
            fontSize: moderateScale(14),
            color: Colors.warm_grey,
            marginBottom: 24,
            textAlign: 'center',
        },
        modalActions: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
        },
        modalButtonCancel: {
            flex: 1,
            backgroundColor: Colors.grey_light,
            paddingVertical: 12,
            borderRadius: 8,
            marginRight: 8,
            alignItems: 'center',
        },
        modalButtonConfirm: {
            flex: 1,
            backgroundColor: Colors.danger_red,
            paddingVertical: 12,
            borderRadius: 8,
            marginLeft: 8,
            alignItems: 'center',
        },
        modalButtonTextCancel: {
            color: Colors.black,
            fontFamily: Fonts.medium,
            fontSize: moderateScale(16),
        },
        modalButtonTextConfirm: {
            color: Colors.white,
            fontFamily: Fonts.medium,
            fontSize: moderateScale(16),
        },
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContainer: {
        paddingBottom: 100,
        paddingHorizontal: scale(20),
    },
    header: {
        alignItems: 'center',
        marginTop: verticalScale(20),
        marginBottom: verticalScale(30),
    },
    headerTitle: {
        fontFamily: Fonts.bold,
        fontSize: moderateScale(24),
        color: Colors.black,
        marginBottom: verticalScale(5),
    },
    headerSubtitle: {
        fontFamily: Fonts.regular,
        fontSize: moderateScale(14),
        color: Colors.warm_grey,
    },
    detailsCard: {
        backgroundColor: Colors.white,
        borderRadius: scale(12),
        padding: scale(20),
        marginBottom: verticalScale(30),
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: Colors.pale_grey_two,
    },
    detailLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        marginRight: scale(10),
        opacity: 0.7,
    },
    detailLabel: {
        fontFamily: Fonts.medium,
        fontSize: moderateScale(14),
        color: Colors.black,
        flex: 1,
    },
    detailValue: {
        fontFamily: Fonts.regular,
        fontSize: moderateScale(14),
        color: Colors.warm_grey,
        textAlign: 'right',
        flex: 1,
    },
    logoutButton: {
        backgroundColor: Colors.danger_red,
        borderRadius: scale(12),
        padding: scale(16),
        marginTop: verticalScale(20),
        shadowColor: Colors.danger_red,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        fontFamily: Fonts.medium,
        fontSize: moderateScale(16),
        color: Colors.white,
        marginLeft: scale(10),
    },
})

