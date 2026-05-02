import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image, Animated, Dimensions, useColorScheme, Appearance } from "react-native";

import BackArrow from '../../assets/image/backArrow.svg';
import ProfileImage from '../../assets/image/account/Profile.webp';

import { Colors } from 'react-native/Libraries/NewAppScreen'
import { styles } from '../../styles/Account/account'
import { lightThemeStyles, darkThemeStyles } from '../../styles/ColorSet'

const MyAccountInfo = ({ infos }) => {




    return (
        <>
            {
                infos ? infos.map((item, index) => (
                    <View
                        key={`profileItem-${index}`}
                        style={styles.profileContainer}
                    >
                        <View style={styles.profileItemImageContainer}>
                            {item.imageType == 'svg' ? <>{item.image}</> : <Image style={styles.profileItemImage} source={item.image || ProfileImage} />}
                        </View>
                        <View>
                            <Text style={styles.profileItemHead}>{item.key}</Text>
                            <Text style={styles.profileItemText}>{item.value}</Text>
                        </View>
                    </View>
                ))
                    : <View></View>
            }

        </>
    )
}

export default MyAccountInfo;