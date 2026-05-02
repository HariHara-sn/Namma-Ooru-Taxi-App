import { ImageBackground, TouchableOpacity, View, Text } from 'react-native';
import React, { useState } from 'react';
import PropTypes from 'prop-types';

import OverlapImage from '../../assets/image/account/mask_group.jpg';

import { styles } from '../../styles/Account/account'
import Ionicons from 'react-native-vector-icons/Ionicons';
import SettingsDropdown from './SettingsDropdown';

const MyAccountHeader = (props) => {

    const { title, onBackClick, onDeleteAccount } = props
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

    const toggleSettingsDropdown = () => {
        setShowSettingsDropdown(!showSettingsDropdown);
    };

    const closeSettingsDropdown = () => {
        setShowSettingsDropdown(false);
    };

    return (
        <ImageBackground
            source={OverlapImage}
            resizeMode="cover"
            style={{ height: 180 }}
        >
            <View style={[styles.tripHeaderContainer]}>
                <TouchableOpacity onPress={() => onBackClick()}>
                   
                        <Ionicons name="chevron-back" size={24} color="black" />
                    
                </TouchableOpacity>
                <Text style={styles.tripHeaderText} >{title}</Text>
                <TouchableOpacity onPress={toggleSettingsDropdown}>
                    <View style={styles.tripHeaderAlarmBtn}>
                        <Ionicons name="settings-outline" size={20} color="black" />
                    </View>
                </TouchableOpacity>
            </View>
            
            <SettingsDropdown
                visible={showSettingsDropdown}
                onClose={closeSettingsDropdown}
                onDeleteAccount={onDeleteAccount}
            />
        </ImageBackground>
    )
}

MyAccountHeader.propTypes = {
    title: PropTypes.string.isRequired,
    onBackClick: PropTypes.func.isRequired,
    onDeleteAccount: PropTypes.func.isRequired,
};

export default MyAccountHeader;