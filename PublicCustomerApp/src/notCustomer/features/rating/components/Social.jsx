import React from 'react';
import { View, Image, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import useConfigStore from '../../../store/useConfigStore'; 
import { height, width } from '../../../utils/Utils';
import { Fonts } from '../../../constants/constants';
const { Linking } = require('react-native');

const Social = () => {
    const { appConfig } = useConfigStore();
    const socialLinks = appConfig?.SOCIAL_MEDIA_LINKS ?? {
        facebook: 'https://www.facebook.com/nammaoorutaxi',
        twitter: 'https://x.com/nammaoorutaxi',
        instagram: 'https://www.instagram.com/nammaoorutaxi',
        linkedin: 'https://www.linkedin.com/company/nammaoorutaxi/posts/?feedView=all',
    };

    const iconMap = {
        facebook: { name: 'facebook', color: '#1877F2' },
        twitter: { name: 'twitter', color: '#1DA1F2' },
        instagram: { name: 'instagram', color: '#E4405F' },
        linkedin: { name: 'linkedin', color: '#0077B5' },
    };

    return (
        <View style={{  flexDirection: 'row', alignItems: 'flex-start' ,backgroundColor:'#f0f0f0' ,padding:5,borderRadius:10}}>
            <View style={{  height: 120, width: 140, justifyContent:'center'}}>
             <Image
                source={require('../../../assets/image/socialImage.webp')}
                resizeMode='contain'
                style={{ width: '100%'}}
            />
            </View>
          
            <View style={{ flex: 1, flexDirection: 'column',justifyContent: 'center',alignItems: 'center',alignSelf:'center' }}>
               
                <Text style={styles.subtitle}>Follow us to stay updated !</Text>
              
                <View style={{ flexDirection: 'row', flexWrap: 'wrap',marginTop:8, justifyContent: 'center' }}>
                {Object.entries(socialLinks).map(([key, url]) => {
                    const { name, color } = iconMap[key] || { name: 'web', color: '#ffffff' };
                    return (
                        <View
                            key={key}
                            style={{
                                width: 35,
                                height: 35,
                                borderRadius: 22,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#ffffff',
                                margin: 6
                            }}
                            onStartShouldSetResponder={() => true}
                            onResponderRelease={() => Linking.openURL(url)}
                        >
                            <Icon name={name} size={24} color={color} />
                        </View>
                    );
                    
                })}
                </View>
            </View>

           
        </View>
    );
};

export default Social;

const styles = {
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        fontFamily:Fonts.regular,
      
    },
};
