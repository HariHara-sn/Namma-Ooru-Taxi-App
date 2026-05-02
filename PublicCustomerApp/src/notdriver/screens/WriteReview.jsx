import { StyleSheet, Text, View , TouchableOpacity, Animated, Platform, TextInput, KeyboardAvoidingView, ScrollView, Alert} from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import  AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import WebView from 'react-native-webview';
import DeviceInfo from 'react-native-device-info';
import { getMessaging } from '@react-native-firebase/messaging';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import { showNotification } from '../../common/components/Alerts/showNotification';
import { Colors, emailPattern, Fonts } from '../../common/constants/constants';
import FullScreenLoader from '../../common/loaders/FullScreenLoader';
import NavBar from '../../common/components/NavBar';
import UseBackButton from '../../common/hooks/UseBackButton';
import { height } from '../../common/utils/scalingutils';
import InputField from '../../common/components/InputField';
import { useTranslation } from 'react-i18next';

const WriteReview = ({isStackScreen}) => {
  const {t} = useTranslation()

    const [isHidden, setIsHidden] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deviceUUID, setDeviceUUID] = useState('');
    const {goBack} = useStackScreenStore();

    const [goodThings, setGoodThings] = useState('');
    const [goodThingsErr, setGoodThingsErr] = useState('');
    const [badThings, setBadThings] = useState('');
    const [badThingsErr, setBadThingsErr] = useState('');
    const [improvements, setImprovements] = useState('');
    const [improvementsErr, setImprovementsErr] = useState('');
    const [issues, setIssues] = useState('');
    const [issuesErr, setIssuesErr] = useState('');
    const [email, setEmail] = useState('');
    const [emailErr, setEmailErr] = useState('');

    const getDeviceUUID = useCallback(async () => {
        setIsLoading(true);
        try {
            const instanceId = await DeviceInfo.getInstanceId();
            setDeviceUUID(instanceId);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.log('error', error);
        }
    }, []);

    useEffect(() => {
        getDeviceUUID();
    }, []);

    const getFcmToken = async () => {
        try {
          const fcmToken = await getMessaging().getToken();
          return fcmToken;
        } catch (error) {
          console.log('Error getting FCM token: ', error);
        }
      };

    const submitFeedback = async () => {
        setIsLoading(true);
        const fcmToken = await getFcmToken();
        const url = 'https://api.gdr.virtualmaze.com/user/feedback.php';
        const data = {
          "type":0,
          "token":fcmToken,
          "goodthings":goodThings,
          "badthings":badThings,
          "improvements":improvements,
          "issues":issues,
          "email":email,
          "version":"",
          "appname":"vmtrackers",
          "platform":"android",
          "store":"Google",
          "deviceUUID":deviceUUID
        };
        try {
            await fetch(url, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setIsLoading(false);
            showNotification('Feedback submitted successfully', '', 'success');
            setIsHidden(false);
        } catch (error) {
            console.log('error', error);
            setIsLoading(false);
            showNotification('Error submitting feedback', '', 'danger');
        }
    }

    const onSubmitPress = () => {
        if (goodThings.length === 0) {
            setGoodThingsErr(t('please_enter_some_good_things'));
        }
       else if (badThings.length === 0) {
            setBadThingsErr(t('please_enter_some_bad_things'));
        }   
        else if (improvements.length === 0) {
            setImprovementsErr(t('please_enter_some_improvements'));
        }
        else if (issues.length === 0) {
            setIssuesErr(t('please_enter_some_issues'));
        }   
        else if (email.trim().length === 0 || !emailPattern.test(email.trim())) {
            setEmailErr(t('please_enter_a_valid_email'));
        }
        else {
            submitFeedback();
        }
    }

  return (
    <View style={{flex:1, backgroundColor:Colors.white}}>
     {!isHidden ? (
        <View style={styles.container}>
              {isLoading && (
        <FullScreenLoader />
      )}
      {isStackScreen && <>
       <NavBar title={t('write_feedback')} onBackPress={()=> goBack()}></NavBar>
      <UseBackButton onBackPress={()=> isHidden ? setIsHidden(false) : goBack()} />
      </>}
      <WebView
        source={{ uri: `https://vmmaps.com/feedbackweb/?id=${deviceUUID}` }}
        style={{ flex: 1}}
        onLoadEnd={() => setIsLoading(false)}
      />
       <TouchableOpacity style={styles.button} onPress={()=>setIsHidden(true)}>
         <AntDesign name='plus' size={24} color='white' />
       </TouchableOpacity>
        </View>
     ):(    
        <KeyboardAvoidingView style={styles.inputViewcontainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {isLoading && (
        <FullScreenLoader />
      )}
        <ScrollView keyboardShouldPersistTaps='handled'>
          <View style={{marginTop:40, width:'90%', alignSelf:'center'}}>
              <InputField
        value={goodThings}
        label={t('say_some_good_things_about_our_app')}
        errorText={goodThingsErr}
        onChangeText={text => {
          setGoodThings(text);
          if (goodThingsErr && text.length > 0) setGoodThingsErr('');
        }}
        icon={<Entypo name='emoji-happy' size={24} color={Colors.black} />}
        multiline={true}
      />
                 <InputField
        value={badThings}
        label={t('say_some_bad_things_about_our_app')}
        errorText={badThingsErr}
        onChangeText={text => {
          setBadThings(text);
          if (badThingsErr && text.length > 0) setBadThingsErr(''); 
        }}
        icon={<Entypo name='emoji-sad' size={24} color={Colors.black} />}
        multiline={true}
      />
        <InputField
        value={improvements}
        label={t('improvements_you_would_like_to_say')}
        errorText={improvementsErr}
        onChangeText={text => {
          setImprovements(text);
          if (improvementsErr && text.length > 0) setImprovementsErr('');
        }}
        icon={<Entypo name='tools' size={24} color={Colors.black} />}
        multiline={true}    
        />
        <InputField
        value={issues}
        label={t('issues_you_are_facing')}
        errorText={issuesErr}
        onChangeText={text => {
          setIssues(text);
          if (issuesErr && text.length > 0) setIssuesErr('');
        }}
        icon={<MaterialIcons name='system-security-update-warning' size={24} color={Colors.black} />}
        multiline={true}
      />        
      <InputField
        value={email}
        label={t('contact_email')}
        errorText={emailErr}
        onChangeText={text => {
          setEmail(text);
          if (emailErr && text.length > 0) setEmailErr('');
        }}
        icon={<Entypo name='email' size={24} color={Colors.black} />}
      />

      </View>
      <TouchableOpacity style={styles.FormButton} onPress={()=>onSubmitPress()}>
        <Text style={styles.FormButtonText}>{t('submit')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.FormButtonCancel} onPress={()=>setIsHidden(false)}>
        <Text style={styles.FormButtonCancelText}>{t('cancel')}</Text>
      </TouchableOpacity>
        </ScrollView>
        </KeyboardAvoidingView>
  )}
</View>
)

}
export default WriteReview

const styles = StyleSheet.create({
    container:{
        flex:1,
    },
    button:{
        position:'absolute',
        bottom:height * 0.12,
        right:10,
        backgroundColor:Colors.periwinkle,
        padding:10,
        borderRadius:50,
        elevation:5,
        shadowColor:Colors.black,
        shadowOffset:{width:0,height:2},
        shadowOpacity:0.25,
        shadowRadius:3.84,
        alignItems:'center',
        justifyContent:'center'
    },
    inputViewcontainer:{
        borderRadius:10,
        paddingBottom:height * 0.1,
        paddingHorizontal:10,
    },
    FormButton:{
        backgroundColor:Colors.periwinkle,
        padding:10,
        borderRadius:50,
        elevation:5,
        shadowColor:Colors.black,
        alignItems:'center',
        justifyContent:'center',
        margin:10,
    },
    FormButtonCancel:{
        backgroundColor:Colors.white,
        padding:10,
        borderRadius:50,
        elevation:5,
        alignItems:'center',
        justifyContent:'center',
        margin:10,
        width:'40%',
    alignSelf:'center'    },
    FormButtonText:{
        color:Colors.white,
        fontSize:16,
       fontFamily:Fonts.regular
    },  
    FormButtonCancelText:{  
        color:Colors.black,
        fontSize:16,
        fontFamily:Fonts.regular
    }
})