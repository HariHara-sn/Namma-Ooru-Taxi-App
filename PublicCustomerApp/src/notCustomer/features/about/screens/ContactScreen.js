import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import NavBar from '../../../components/NavBar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../../../constants/constants';
import ContactPageImage from '../../../assets/image/common/contactPageImage.svg';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import { useTranslation } from 'react-i18next';

const ContactScreen = () => {
  const {goBack} = useStackScreenStore();
  const { t } = useTranslation();
  
  const contactData = {
    logo: require('../../../assets/image/common/contactPageImage.svg'),
    phone: '+91 90921 90321',
    email: 'reachus@virtualmaze.co.in',
    socialLinks: {
      whatsapp: 'whatsapp://send?phone=9092190321',
      phone: 'tel:+919092190321',
      email: 'mailto:reachus@virtualmaze.co.in',
      facebook: 'https://www.facebook.com/VirtualMaze/'
    }
  };

  const HandleBackBtn = () => {
    goBack();
  };

  const openLink = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      }
    });
  };

  return (
    <>
      <NavBar withBg={true} onBackPress={HandleBackBtn} title={t('contact_us')} />
      <View style={styles.container}>
        
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <ContactPageImage />
        </View>

        {/* Contact Info Section */}
        <View style={styles.contactInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={30} color={colors.violet} />
            <View>
              <Text style={styles.infoTextHeading}>{t('contact_call_us')}</Text>
              <Text style={styles.infoText}>{contactData.phone}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={30} color={colors.violet} />
            <View>
              <Text style={styles.infoTextHeading}>{t('contact_email_us')}</Text>
              <Text style={styles.infoText}>{contactData.email}</Text>
            </View>
            
          </View>
        </View>

        {/* Social Links Section */}
        <View style={styles.socialLinks}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink(contactData.socialLinks.whatsapp)}
          >
            <Ionicons name="logo-whatsapp" size={28} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink(contactData.socialLinks.phone)}
          >
            <Ionicons name="call" size={28} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink(contactData.socialLinks.email)}
          >
            <Ionicons name="mail" size={28} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink(contactData.socialLinks.facebook)}
          >
            <Ionicons name="logo-facebook" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>

      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logo: {
    width: 200,
    height: 100,
  },
  contactInfo: {
    marginVertical: 30,
  },
  infoTextHeading: {
    marginLeft: 15,
    fontSize: 16,
    color: colors.black,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  infoText: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 40,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContactScreen;
