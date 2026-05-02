import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Dimensions, Linking, Image, Platform, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AdaptiveText from '../../../notCustomer/components/Common/AdaptiveText';
import i18n from '../../../common/i18n';
import { colors, Fonts } from '../../../notCustomer/constants/constants';
import { GlobalContext } from '../../../context/GlobalContext';
import { useStackScreenStore } from '../../../notCustomer/store/useStackScreenStore';
import { goBack } from '../../navigation/RootNavigation';
import { DataStore } from '../../controllers/DataStore';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';
import useUserInfoStore from '../../store/useUserInfoStore';
const PLAY_STORE_PACKAGE_NAME = 'com.vmtrackers';
const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_NAME}`;
const DRIVER_APP_LOGO = require('../../../notCustomer/assets/image/driverLogo.webp');
const DRIVER_BANNER = require('../../../notCustomer/assets/image/driverBanner.webp');


const FEATURE_CARDS = [
  {
    title: 'Earn Money',
    description: 'Unlock higher income with surge pricing and reliable customer demand.',
    image: require('../../../notCustomer/assets/image/driverEarning.webp'),
  },
  {
    title: 'Frequent Rides',
    description: 'Stay busy thanks to our rider network that keeps your schedule full.',
    image: require('../../../notCustomer/assets/image/driverRequest.webp'),
  },
  {
    title: '24/7 Support',
    description: 'Reach our dedicated support team any time you need assistance on the road.',
    image: require('../../../notCustomer/assets/image/support.webp'),
  },
];

// Configurable steps to become a driver (JSON-like structure)
const DRIVER_STEPS = [
 
  {
    key: 'signup',
    title: 'Sign Up',
    description: 'Download VM Tracker App and Create your driver profile with basic information.',
    image: require('../../../notCustomer/assets/image/support.webp'),
  },
  {
    key: 'documents',
    title: 'Upload Documents',
    description: 'Submit license, vehicle papers, and identity proof.',
    image: require('../../../notCustomer/assets/image/support.webp'),
  },
  {
    key: 'verification',
    title: 'Get Verified',
    description: 'We review your details and verify your account.',
    image: require('../../../notCustomer/assets/image/support.webp'),
  },
  {
    key: 'start-earning',
    title: 'Start Earning',
    description: 'Go online and accept ride requests to earn.',
    image: require('../../../notCustomer/assets/image/support.webp'),
  },
];

const DriverAccessScreen = ({fromHome=false}) => {
  const navigation = useNavigation();
  const { theme } = useContext(GlobalContext);
  const scrollRef = useRef(null);
  const currentIndexRef = useRef(0);
  const cardWidth = Dimensions.get('window').width ;
  const cardHeight = Dimensions.get('window').height / 2;
  const bannerSize = Math.min(cardWidth, Dimensions.get('window').height / 2);
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardBackgroundColor = colors.blue_xxdark;
  const cardTitleColor = colors.white;
  const cardDescriptionColor = 'rgba(255, 255, 255, 0.72)';
  const { setStackScreen , goBack} = useStackScreenStore();
  const { reset } = useStackScreenStore(); 
  const { resetUserInfo } = useUserInfoStore();   
  const { removeListener } = useContext(GlobalContext);   
 const {t} = useTranslation();
 
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndexRef.current + 1) % FEATURE_CARDS.length;

      if (scrollRef.current) {
        scrollRef.current.scrollTo({ x: nextIndex * cardWidth, animated: true });
        currentIndexRef.current = nextIndex;
        setCurrentIndex(nextIndex);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [cardWidth]);

  const handleProceed = () => {
    navigation.navigate('LoginScreen', { mode: 'driver' });
  };

  const handleGoBack = () => {
    console.log('handleGoBack ..............................',fromHome);
      if (fromHome == true) {
        console.log('fromHome ..............................');
        goBack();
      } else {
        try{
          navigation.goBack();

        }catch(err){
          console.warn('Error going back:', err);
        }
      
      }
  }

  

  const handleContactUs = () => {
    if (fromHome) {
      setStackScreen('ContactScreen');
    }else{
      navigation.navigate('ContactScreen');

    }

  };

  const handleMomentumScrollEnd = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    currentIndexRef.current = index;
    setCurrentIndex(index);
  };

  const handleOpenPlayStore = async () => {
    const marketUrl = `market://details?id=${PLAY_STORE_PACKAGE_NAME}`;

    try {
      const canOpenMarketUrl = await Linking.canOpenURL(marketUrl);

      if (canOpenMarketUrl) {
        await Linking.openURL(marketUrl);
        return;
      }
    } catch (error) {
      console.warn('Failed to open Play Store app link', error);
    }

    try {
      await Linking.openURL(PLAY_STORE_WEB_URL);
    } catch (error) {
      console.warn('Failed to open Play Store web link', error);
    }
  };
  const Logout = async () => {
        await DataStore.storeData('access_token', null);
        await DataStore.storeData('refresh_token', null);
        await DataStore.storeData('userdetails', null);
        reset()
        resetUserInfo();
        await removeListener();
        navigation.reset({
          index: 0,
          routes: [{ name: 'WelcomeScreen' }],
        });
    
  };

  const handleClick = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        t('driver_access_logout_confirm_title'),
        t('driver_access_logout_confirm_message'),
        [
          {
            text: t('driver_access_logout_confirm_cancel_button'),
            style: 'cancel',
          },
          {
            text: t('driver_access_logout_confirm_confirm_button'),
            style: 'destructive',
            onPress: Logout,
          },
        ],
        { cancelable: true }
      );
      return;
    }

    if (Platform.OS === 'ios') {
      Alert.alert(
        t('driver_access_ios_alert_title'),
        t('driver_access_ios_alert_message')
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor:  '#F5F5F5',}] }>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
        <View style={styles.backButtonInner}>
          <Ionicons name="chevron-back" size={25} color={colors.black} />
        </View>
      </TouchableOpacity>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.bannerWrapper, { width: bannerSize, height: bannerSize }] }>
          <Image source={DRIVER_BANNER} style={styles.banner} resizeMode="cover" />
          <View style={styles.bannerOverlay}>
            <AdaptiveText style={styles.bannerOverlayTitle}>
              {i18n.t('driver_access_banner_title')}
            </AdaptiveText>
            <Text style={styles.bannerOverlayText}>
              {i18n.t('driver_access_banner_subtitle')}
            </Text>
          </View>
          
        </View>

        <View style={styles.section}>
         
          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor:  colors.blue_xxdark }] }
             onPress={handleClick}
          >
            <Text style={[styles.linkButtonText, { color: colors.yellow}] }>
              
              {Platform.OS === 'ios' ?  i18n.t('driver_access_download_driver_app') : i18n.t('Sign_Up_to_Become_a_Driver') }
            </Text>
          </TouchableOpacity>

          
        </View>

        {/* Steps to become a driver (zigzag, image/text alternating) */}
        <View style={[styles.section, styles.stepsSection]}>
          <AdaptiveText style={[styles.sectionTitle, { color: '#0F223C'}] }>
            {i18n.t('driver_access_how_to_become_driver')}
          </AdaptiveText>
          <View style={styles.stepsList}>
            {DRIVER_STEPS.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <View key={step.key} style={styles.stepBlock}>
                  <View
                    style={[
                      styles.stepRow,
                      { flexDirection: isEven ? 'row' : 'row-reverse' },
                    ]}
                  >
                    <View style={styles.stepCircleContainer}>
                      <View style={styles.stepCircle}>
                        <Text style={styles.stepCircleText}>{index + 1}</Text>
                      </View>
                    </View>
                    <View style={styles.stepTextContainer}>
                      <Text style={[styles.stepNumberTitle, { color: colors.yellow }] }>
                        {`Step ${index + 1}: `}
                        <Text style={[styles.stepInlineTitle, { color: '#0F223C' }]}>
                          {i18n.t(`driver_access_steps_${step.key.replace('-', '_')}_title`)}
                        </Text>
                      </Text>
                      <Text style={[styles.stepDescription, { color: 'rgba(15, 34, 60, 0.8)' }] }>
                        {i18n.t(`driver_access_steps_${step.key.replace('-', '_')}_desc`)}
                      </Text>
                    </View>
                  </View>
                  {index < DRIVER_STEPS.length - 1 && (
                    <View style={styles.stepConnectorWrapper}>
                      <View style={styles.stepConnector} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

             {/* Help/Support CTA */}
        <View style={[styles.section, styles.helpSection]}>
          <View style={styles.helpCard}>
            <Text style={styles.helpIcon}>📞</Text>
            <View style={styles.helpTextWrap}>
              <AdaptiveText style={[styles.helpTitle, { color: '#0F223C'}] }>
                {i18n.t('driver_access_help_title')}
              </AdaptiveText>
              <Text style={[styles.helpSubtitle, { color: 'rgba(15, 34, 60, 0.8)' }] }>
                {i18n.t('driver_access_help_subtitle')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.blue_xxdark }]}
            onPress={handleContactUs}
          >
            <Text style={[styles.contactButtonText, { color: colors.white }]}>{i18n.t('driver_access_go_to_contact_us')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.carouselSection]}>
          <AdaptiveText style={[styles.sectionTitle, { color: '#0F223C'}] }>
            {i18n.t('driver_access_why_drivers_choose_us')}
          </AdaptiveText>
          <View style={[styles.carouselContainer, { height: cardHeight }]}>
            <ScrollView
              horizontal
              ref={scrollRef}
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              contentContainerStyle={styles.carouselContent}
            >
              {FEATURE_CARDS.map((card, index) => (
                <View
                  key={card.title}
                  style={[styles.card, { width: cardWidth, height: cardHeight, backgroundColor: cardBackgroundColor }] }
                >
                  <View style={styles.cardImageContainer}>
                    <Image source={card.image} style={styles.cardImage} resizeMode="cover" />
                  </View>
                  <View style={[styles.cardContent, { backgroundColor: cardBackgroundColor }] }>
                    <AdaptiveText style={[styles.cardTitle, { color: cardTitleColor }] }>
                      {card.title}
                    </AdaptiveText>
                    <Text style={[styles.cardDescription, { color: cardDescriptionColor }] }>
                      {card.description}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.indicatorContainer}>
              {FEATURE_CARDS.map((card, index) => (
                <View
                  key={card.title}
                  style={[styles.indicatorDot, currentIndex === index && styles.indicatorDotActive]}
                />
              ))}
            </View>
          </View>
        </View>

   
      </ScrollView>

    </View>
  );
};



export default DriverAccessScreen;

const styles = StyleSheet.create({
    backButton: {
      position: 'absolute',
      top: 32,
      left: 20,
      zIndex: 10,
      borderRadius: 24,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 5,
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backButtonInner: {
      borderRadius: 22,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: {
      width: 22,
      height: 22,
      resizeMode: 'contain',
      tintColor: '#222',
    },
  container: {
    flex: 1,
 
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    gap: 24,
  },
  contentContainer: {
    paddingBottom: 24,
    gap: 20,
  },
  section: {
    width: '100%',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  // Ensure sections have spacing and don't stretch awkwardly in scroll
  carouselSection: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 16,
   
  },
  bannerWrapper: {
    alignSelf: 'flex-end',
   
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  bannerOverlayTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 20,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bannerOverlayText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: colors.white,
    lineHeight: 20,
  },
  bannerBottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: 'rgba(0,0,0,0.12)',
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -8 },
    elevation: 6,
  },
  logo: {
    width: 72,
    height: 72,
  },
  carouselSection: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 16,
     marginTop: 26,
  },
  title: {
    fontFamily: Fonts.semi_bold,
    fontSize: 28,
    textAlign: 'left',
    marginBottom: 12,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    textAlign: 'left',
    lineHeight: 24,
  },
  highlightText: {
    color: colors.blue_xxdark,
  },
  sectionTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  appName: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    textTransform: 'uppercase',
  },
  linkButton: {
    marginVertical: 15,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 2,
    width: '70%',
  },
  linkButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  stepsSection: {
    gap: 12,
    backgroundColor: colors.grey_xlight,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 16,
    marginBottom: 28,
  },
  stepsList: {
    gap: 20,
    paddingVertical: 8,
  },
  stepBlock: {
    
  },
  stepRow: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    width: '100%',
  },
  stepConnectorWrapper: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnector: {
    width: '100%',
    borderWidth: 0.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(15, 34, 60, 0.35)',
  },
  stepCircleContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: '#0F223C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: '#0F223C',
  },
  stepTextContainer: {
    flex: 1,
    gap: 6,
  },
  stepNumberTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
  },
  stepInlineTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
  },
  stepDescription: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  carouselContainer: {
    width: '100%',
    elevation: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  carouselContent: {
    alignItems: 'stretch',
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    
  },
  cardImageContainer: {
    flex: 3,
    backgroundColor: colors.white,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 2,
    padding: 20,
    justifyContent: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 20,
  },
  cardDescription: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(94, 94, 94, 1)',
  },
  indicatorDotActive: {
    width: 16,
    borderRadius: 8,
    backgroundColor: colors.yellow,
  },
  helpSection: {
    gap: 16,
    paddingVertical: 24,
    marginBottom: 28,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.grey_xlight,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  helpIcon: {
    fontSize: 28,
  },
  helpTextWrap: {
    flex: 1,
    gap: 4,
  },
  helpTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
  },
  helpSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  contactButton: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 24,
    marginTop: 8,
  },
  contactButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  actions: {
    width: '100%',
    gap: 16,
    marginTop: 32,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: Fonts.medium,
    color: colors.white,
    fontSize: 16,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    textTransform: 'uppercase',
  },
});
