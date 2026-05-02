import { Text, TouchableOpacity, View, StyleSheet, Vibration } from 'react-native';
import React, { useState, useContext, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useStackScreenStore } from '../../common/store/useStackScreenStore';
import GlobalContext from '../../context/GlobalContext';
import { languages } from '../../notCustomer/constants/JsonData';
import i18n from '../../common/i18n';
import { DataStore } from '../../common/controllers/DataStore';
import NavBar from '../../common/components/NavBar';
import { Colors, Fonts } from '../../common/constants/constants';
import UseBackButton from '../../common/hooks/UseBackButton';

const LanguageScreen = ({fromDrawer, fromSettings, fromDriverStack}) => {
  const navigation = useNavigation();
  const {goBack} = useStackScreenStore();
  const [InsideAppLanguageChange, setInsideAppLanguageChange] = useState(false);
  const { t } = useTranslation();
  const { 
    theme, 
  } = useContext(GlobalContext);

  const [selected, setSelected] = useState(languages[0]);

  // Initialize selected language based on current i18n language
  useEffect(() => {
    const currentLanguage = i18n.language;
    const currentLangObj = languages.find(lang => lang.code === currentLanguage);
    if (currentLangObj) {
      setSelected(currentLangObj);
    }
  }, []);

  const changeLanguage = item => {
    setSelected(item);
  };

  const handleLanguageChange = (language) => {
    changeLanguage(language);
    // i18n.changeLanguage(language.code);
  };

  const onNextPress = async () => {  
       await DataStore.storeData('language', selected.code);
       i18n.changeLanguage(selected.code);
       goBack();
  };

  const handleLanguageChangeInSideApp = (language) => {
     changeLanguage(language);
    setInsideAppLanguageChange(language);
  }

  return (
    <View style={[styles.screen]}>
       {fromSettings  ? <></> : <View style={styles.header}> 
      {<NavBar withBg={true} onBackPress={() => goBack()} title={'Choose Language'} />}       
      </View>}
      <UseBackButton onBackPress={() => goBack()} />
      <View style={styles.langContainer}>
        {languages.map((item) => (
          <View key={item.id} style={styles.langItemWrapper}>
            <TouchableOpacity
              onPress={() => handleLanguageChange(item)}
              style={[
                styles.langBtn,
                {
                  backgroundColor:
                    selected.id === item.id ? theme.primary_secondary : Colors.white,
                },
              ]}>
              <Text style={styles.langTxt}>{item.name}</Text>
              {item.code !== 'en' && <Text style={styles.langSubTxt}>{item.name_en}</Text>}
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.nextBtn]}
        onPress={() => onNextPress()}>
        <Text style={[styles.nextBtnTxt]}>{t('done')}</Text>
      </TouchableOpacity>
    </View>
    
  );
};

export default LanguageScreen;
const styles = StyleSheet.create({
    screen: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: Colors.white,
      paddingHorizontal: 10,
    },
    header: {
      width: '90%',
      alignItems: 'center',
     
      minHeight: 130,
  
    },
    title: {
      fontFamily: Fonts.semi_bold,
      fontSize: 32,
      color: Colors.black,
      marginTop: 30,
      textAlign: 'center',
    },
    langContainer: {
      width: '90%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 30,
    },
    langItemWrapper: {
      width: '48%',
      marginBottom: 15,
    },
    langBtn: {
      backgroundColor: Colors.white,
      borderRadius: 5,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      paddingVertical: 30,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      height:130,
    },
    langTxt: {
      fontFamily: Fonts.semi_bold,
      color: Colors.black,
      fontSize: 16,
    },
    langSubTxt: {
      fontFamily: Fonts.regular,
      color: Colors.black,
      fontSize: 12,
    },
    nextBtn: {
      position: 'absolute',
      bottom: 20,
      backgroundColor: Colors.blue_xxdark,
      width: '80%',
      paddingVertical: 10,
      borderRadius: 30,
      alignItems: 'center',
    },
    nextBtnTxt: {
      fontFamily: Fonts.medium,
      color: Colors.white,
      fontSize: 14,
      textTransform: 'uppercase',
    },
  });           
