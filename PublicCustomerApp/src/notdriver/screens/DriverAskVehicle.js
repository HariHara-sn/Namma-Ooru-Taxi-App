import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import useUserStore from '../../common/store/useUserStore'
import { useStackScreenStore } from '../../common/store/useStackScreenStore'
import usePublicDriverStore from '../store/usePublicDriverStore'
import APIRequest from '../../common/APIRequest'
import { showNotification } from '../../common/components/Alerts/showNotification'
import FullScreenLoader from '../../common/loaders/FullScreenLoader'
import NavBar from '../../common/components/NavBar'
import { Colors, colors, Fonts } from '../../common/constants/constants'
import { useTranslation } from 'react-i18next'

const DriverAskVehicle = () => {
    const {userInfo} = useUserStore()
    const {setStackScreen} = useStackScreenStore()
    const [loading, setLoading] = useState(false)
    const {vendorId,setVehicleInfo} = usePublicDriverStore()
    const [vehicleList, setVehicleList] = useState([])
    const {t} = useTranslation()

    const onChooseVehicle = async (vehicle) => {
        const api = new APIRequest()
        const vehicleId = vehicle._id
        setLoading(true)
          try {
            const response = await api.request(`/publicrides/driver/v2/updateDriverVehicle?vehicleId=${vehicleId}`,"POST", {}, userInfo?.token)
            if(response.success){
              setVehicleInfo(vehicle);
              setStackScreen('Home')
              showNotification('Vehicle updated successfully', 'success')
            } else {
              showNotification(response?.message, '', 'danger')
            }
          } catch (error) {
            console.error('Error updating vehicle details:', error);
            showNotification(error?.message || 'Failed to get vehicle list', 'danger')
          } 
        setLoading(false)
    }

    const getVendorVehicleList = async () => {
        setLoading(true)
        const api = new APIRequest()
        try {
            const response = await api.request(`/publicrides/driver/v2/getAvailabelVendorVehicle?vendorId=${vendorId}`,"GET", {}, userInfo?.token)
            if(response.success){
                setVehicleList(response.vehicleList)
            } else {
                showNotification(response?.message || 'Failed to get vehicle list', 'danger')
            }
        } catch (error) {
            console.log('hari-->>error',error)
            showNotification(error?.message || 'Failed to get vehicle list', 'danger')
        }
        setLoading(false)
    }

    useEffect(() => {
        getVendorVehicleList()
    }, [])

    const handleVehicleSelect = (vehicle) => {
        // if (vehicle.driverId) {
        //     showNotification('This vehicle is already assigned to another driver', 'warning')
        //     return
        // }
        onChooseVehicle(vehicle)
    }

    const renderVehicleCard = ({ item, index }) => {
        const vehicle = item
        const isBlocked = vehicle.driverId !== null
        const isAvailable = !isBlocked

        return (
            <View 
                style={[
                    styles.vehicleCard,
                    isBlocked && styles.blockedCard
                ]}
                onPress={() => handleVehicleSelect(vehicle)}
                disabled={isBlocked}
                activeOpacity={isBlocked ? 1 : 0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.vehicleInfo}>
                        <Text style={styles.registrationNumber}>
                            {vehicle.regNo}
                        </Text>
                        <View style={[
                            styles.statusBadge,
                            isBlocked ? styles.blockedBadge : styles.availableBadge
                        ]}>
                            <Text style={[
                                styles.statusText,
                                isBlocked ? styles.blockedText : styles.availableText
                            ]}>
                                {isBlocked ? t('blocked') : t('available')}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.vehicleDetails}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('make') || 'Make'}:</Text>
                            <Text style={styles.detailValue}>{vehicle.make}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('model') || 'Model'}:</Text>
                            <Text style={styles.detailValue}>{vehicle.model}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('type') || 'Type'}:</Text>
                            <Text style={styles.detailValue}>{vehicle.type}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('color') || 'Color'}:</Text>
                            <Text style={styles.detailValue}>{vehicle.color}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t('year') || 'Year'}:</Text>
                            <Text style={styles.detailValue}>{vehicle.year}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    {isAvailable ? (
                        <TouchableOpacity 
                            style={styles.chooseButton}
                            onPress={() => handleVehicleSelect(vehicle)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.chooseButtonText}>{t('choose_vehicle')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.disabledButton}>
                            <Text style={styles.disabledButtonText}>{t('not_available')}</Text>
                        </View>
                    )}
                </View>

                {isBlocked && (
                    <View style={styles.blockedOverlay}>
                        <Text style={styles.blockedMessage}>
                            {t('already_assigned_to_driver')}
                        </Text>
                    </View>
                )}
            </View>
        )
    }

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('no_vehicles_available')}</Text>
            <Text style={styles.emptySubtext}>
                {t('please_contact_your_administrator')}
            </Text>
        </View>
    )

    const keyExtractor = (item, index) => item._id || index.toString()

    return (
        <View style={styles.container}>
            {loading && <FullScreenLoader message={t('loading_vehicles')} />}
             <NavBar title={t('available_vehicles')}/>
            <View style={styles.header}>
                <Text style={styles.headerSubtitle}>
                    {t('choose_from_available_vehicles')}
                </Text>
            </View>
            <FlatList
                data={vehicleList}
                renderItem={renderVehicleCard}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyComponent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        padding: 20,
        paddingTop: 40,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.grey_light,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontFamily:Fonts.semi_bold,
        color: Colors.black,
        marginBottom: 5,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.warm_grey,
            fontFamily:Fonts.regular,
        textAlign: 'center',
    },
    flatListContent: {
        padding: 20,
        paddingBottom: 40,
    },
    separator: {
        height: 16,
    },
    vehicleCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        elevation: 2,
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        position: 'relative',
    },
    blockedCard: {
        opacity: 0.6,
    },
    cardHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.grey_light,
    },
    vehicleInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    registrationNumber: {
        fontSize: 18,
        fontFamily:Fonts.semi_bold,
        color: Colors.black,
    },
    statusBadge: {  
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    availableBadge: {
        backgroundColor: Colors.green_light,
    },
    blockedBadge: {
        backgroundColor: Colors.pink_light,
    },
    statusText: {
        fontSize: 12,
        fontFamily:Fonts.semi_bold
    },
    availableText: {
        color: Colors.green_dark,
    },
    blockedText: {
        color: Colors.danger_red,
    },
    cardBody: {
        padding: 16,
    },
    vehicleDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: Colors.warm_grey,
        fontFamily:Fonts.semi_bold,
    },
    detailValue: {
        fontSize: 14,
        color: Colors.black,
        fontFamily:Fonts.semi_bold,
    },
    blockedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blockedMessage: {
        color: Colors.danger_red,
        fontSize: 14,
        fontFamily:Fonts.semi_bold,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontFamily:Fonts.semi_bold,
        color: Colors.warm_grey,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.cool_grey,
        textAlign: 'center',
    },
    cardFooter: {
        padding: 16,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: Colors.grey_light,
        marginTop: 8,
    },
    chooseButton: {
        backgroundColor: Colors.bright_orange,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chooseButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontFamily: Fonts.semi_bold,
    },
    disabledButton: {
        backgroundColor: Colors.grey_light,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButtonText: {
        color: Colors.warm_grey,
        fontSize: 16,
        fontFamily: Fonts.semi_bold,
    },
})

export default DriverAskVehicle

