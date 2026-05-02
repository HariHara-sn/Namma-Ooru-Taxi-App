import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image, Animated, Dimensions, useColorScheme, Appearance } from "react-native";

import BackArrow from '../../assets/image/backArrow.svg';
import ProfileImage from '../../assets/image/svgIcons/profileImage.svg';

import { Colors } from 'react-native/Libraries/NewAppScreen'
import { styles } from '../../styles/Account/account'
import { lightThemeStyles, darkThemeStyles } from '../../styles/ColorSet'
import { Fonts } from '../../constants/constants';
import FemaleAvatar from '../../assets/image/femaleAvatar.svg';
import useUserInfoStore from '../../../common/store/useUserInfoStore';

const MyAccountProfileImage = (props) => {

    const { id, name, ratingData } = props
    const {userdetails} = useUserInfoStore();

    const ColorSet = Appearance.getColorScheme() === 'light' ? lightThemeStyles : lightThemeStyles;


    return (
        <>
            <View style={[styles.container, { paddingTop: 24 }]}>
                <View style={[styles.profileImgContainer, { position: 'relative', marginTop: 0, zIndex: 1 }] }>
                    {userdetails?.gender === 'female' ? <FemaleAvatar width={100} height={100} /> : <ProfileImage width={100} height={100} />}
                </View> 
            </View>
            <View style={[styles.container, { paddingBottom:20 }]}>

                <Text style={{ fontSize: 24, fontFamily:Fonts.semi_bold, color: ColorSet.black, marginTop: 12 }}>{name}</Text>
                {/* <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#6c63ff' }}>{id}</Text> */}
                
                {/* Rating Display */}
                {ratingData?.currentrating && (
                    <View style={styles.ratingContainer}>
                        <View style={styles.starContainer}>
                            {[1, 2, 3, 4, 5].map((star) => {
                                const rating = ratingData.currentrating;
                                const filledStars = Math.floor(rating);
                                const hasPartialStar = rating % 1 !== 0;
                                const partialStarIndex = filledStars + 1;
                                
                                if (star <= filledStars) {
                                    // Fully filled star
                                    return (
                                        <Text 
                                            key={star} 
                                            style={[styles.star, { color: '#FFD700' }]}
                                        >
                                            ★
                                        </Text>
                                    );
                                } else if (star === partialStarIndex && hasPartialStar) {
                                    // Partially filled star
                                    const partialFill = rating % 1;
                                    return (
                                        <View key={star} style={styles.partialStarContainer}>
                                            <Text style={[styles.star, { color: '#E0E0E0' }]}>★</Text>
                                            <View style={[
                                                styles.partialStarFill, 
                                                { width: `${partialFill * 100}%` }
                                            ]}>
                                                <Text style={[styles.star, { color: '#FFD700' }]}>★</Text>
                                            </View>
                                        </View>
                                    );
                                } else {
                                    // Empty star
                                    return (
                                        <Text 
                                            key={star} 
                                            style={[styles.star, { color: '#E0E0E0' }]}
                                        >
                                            ★
                                        </Text>
                                    );
                                }
                            })}
                        </View>
                        <Text style={styles.ratingText}>
                            {(ratingData?.currentrating != null ? ratingData.currentrating.toFixed(1) : '0.0')} ({ratingData?.count != null ? ratingData.count : 0} reviews)
                        </Text>
                    </View>
                )}
            </View>
        </>
    )
}

export default MyAccountProfileImage;