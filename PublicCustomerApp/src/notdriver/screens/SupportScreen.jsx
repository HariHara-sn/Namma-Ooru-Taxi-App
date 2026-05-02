import {Alert, Linking, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import { Colors, contactMail, contactPhone, Fonts } from '../../common/constants/constants';
import NavBar from '../../common/components/NavBar';
import UseBackButton from '../../common/hooks/UseBackButton';
import { settingsScreen } from '../styles/SettingsStyles';
import Language from '../../notdriver/assets/icons/Language.svg'
import Writereview from '../../notdriver/assets/icons/writereview.svg'
import Support from '../../notdriver/assets/icons/support.svg'
import Call from '../../notdriver/assets/icons/call.svg'
import Mail from '../../notdriver/assets/icons/mail.svg'
import WhatsApp from '../../notdriver/assets/icons/whatsApp.svg'
import CallWhite from '../../notdriver/assets/icons/callWhite.svg'
import MailWhite from '../../notdriver/assets/icons/mailWhite.svg'
import { useTranslation } from 'react-i18next';

const SupportScreen = ({isStackScreen, showBg}) => {
  const {t} = useTranslation();
  const {goBack} = useStackScreenStore();
  const {setStackScreen} = useStackScreenStore();

  const onWhatsAppPress = () => {
    Linking.openURL(`whatsapp://send?phone=${contactPhone}`);
    const formattedPhone = contactPhone.replace(/\D/g, '');

    Linking.canOpenURL(`whatsapp://send?phone=${formattedPhone}`)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'WhatsApp is not available');
        } else {
          Linking.openURL(`whatsapp://send?phone=${formattedPhone}`);
        }
      })
      .catch(err => {
        console.error(err);
        Alert.alert('Error', 'Failed to open WhatsApp');
      });
  };

  const onCallPress = () => {
    const phoneNumber = contactPhone.replace(/\s+/g, '');

    Linking.canOpenURL(`tel:${phoneNumber}`)
      .then(supported => {
        if (!supported) {
          Alert.alert('Error', 'Phone call not supported');
        } else {
          Linking.openURL(`tel:${phoneNumber}`);
        }
      })
      .catch(err => console.error(err));
  };

  const onMailPress = () => {
    Linking.openURL(`mailto:${contactMail}`);
  };

  const writeFeedBack = () => {
      return (
        <View style={styles.NavButtonContainer}>
        <TouchableOpacity style={styles.writeReviewBtn} onPress={() => setStackScreen('WriteReview')}>
          <Writereview width={35} height={35} />
          <Text style={styles.writeReviewTxt}>{t('write_feedback')}</Text>
        </TouchableOpacity>
          <TouchableOpacity style={styles.writeReviewBtn} onPress={() => setStackScreen('LanguageSelectionScreen')}>
          <Language />
          <Text style={styles.writeReviewTxt}>{t('language')}</Text>
        </TouchableOpacity>
          </View>
      )
  }

  return (
    <View style={settingsScreen.screen}>
      {isStackScreen && <>
        <NavBar title={"contact_us"} onBackPress={() => goBack()} />
          <UseBackButton onBackPress={() => goBack()} />
      </>}
      {!showBg ? <View style={settingsScreen.supportBg}>
        <Support />
      </View> : writeFeedBack()}
      
      <View style={settingsScreen.infoContainer}>
        <View style={settingsScreen.infoCard}>
          <Call />
          <View style={{gap: 10}}>
            <Text style={settingsScreen.infoTitle}>{t('call_support')}</Text>
            <Text style={settingsScreen.infoTxt}>{contactPhone}</Text>
          </View>
        </View>
        <View style={settingsScreen.infoCard}>
          <Mail />
          <View style={{gap: 10}}>
            <Text style={settingsScreen.infoTitle}>{t('send_email')}</Text>
            <Text style={settingsScreen.infoTxt}>{contactMail}</Text>
          </View>
        </View>
      </View>
      <View style={settingsScreen.btnContainer}>
        <TouchableOpacity
          onPress={() => onWhatsAppPress()}
          style={[settingsScreen.actionBtns]}>
          <WhatsApp />
          <Text style={settingsScreen.btnTxt}>{t('whatsapp')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onCallPress()}
          style={settingsScreen.actionBtns}>
          <View style={settingsScreen.actionBtnsBg}>
            <CallWhite />
          </View>
          <Text style={settingsScreen.btnTxt}>{t('call')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onMailPress()}
          style={settingsScreen.actionBtns}>
          <View style={settingsScreen.actionBtnsBg}>
            <MailWhite />
          </View>
          <Text style={settingsScreen.btnTxt}>{t('mail')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SupportScreen;

const styles = StyleSheet.create({
    NavButtonContainer:{
      width:'90%',
      alignSelf:'center',
      marginVertical:10,
      gap:20,
      marginBottom:30,
      borderBottomWidth:1,
      paddingBottom:20,
      borderBottomColor:Colors.grey_dark,
    },
    writeReviewBtn:{
      flexDirection:'row',
      gap:10,
      alignItems:'center',
    },
    writeReviewTxt:{
      fontFamily: Fonts.regular,
      fontSize:16,
      color:Colors.black
    }
})
