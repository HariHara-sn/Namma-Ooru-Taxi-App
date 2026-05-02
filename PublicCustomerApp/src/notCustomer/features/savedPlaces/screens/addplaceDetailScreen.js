import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import NavBar from '../../../components/NavBar';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import {utils} from '../../../utils/Utils';
import { Fonts } from '../../../constants/constants';
import useMapStore from '../../map/store/useMapStore';
import Marker from '../../../controllers/NEMap/Marker';
import useMapStyleStore from '../../../store/useMapStyleStore';
import {height } from '../../../utils/Utils'
import AdaptiveText from '../../../components/Common/AdaptiveText';

// Utility to remove emojis and related modifiers/ZWJ sequences
const stripEmojis = (input) => {
  if (!input) return '';
  let result = '';
  for (let i = 0; i < input.length; ) {
    const codePoint = input.codePointAt(i);
    const char = String.fromCodePoint(codePoint);
    const isEmoji =
      codePoint > 0xFFFF ||
      (codePoint >= 0x2600 && codePoint <= 0x27BF) ||
      (codePoint >= 0x1F300 && codePoint <= 0x1F6FF) ||
      (codePoint >= 0x1F900 && codePoint <= 0x1F9FF) ||
      (codePoint >= 0x1FA70 && codePoint <= 0x1FAFF) ||
      (codePoint >= 0x1F1E6 && codePoint <= 0x1F1FF) ||
      codePoint === 0x200D ||
      (codePoint >= 0x1F3FB && codePoint <= 0x1F3FF) ||
      codePoint === 0xFE0F;
    if (!isEmoji) result += char;
    i += char.length;
  }
  return result;
};

const AddPlaceDetailScreen = ({ placeData, handleSavePlace, edit = false, existingLabel = '' }) => {
  const { t } = useTranslation();
  const {goBack} = useStackScreenStore();
  const { setMapMarkers ,setMapLocation} = useMapStore();
  const [selectedOption, setSelectedOption] = useState(edit ? (existingLabel === 'home' || existingLabel === 'work' ? existingLabel : 'nickname') : 'nickname');
  const [nickname, setNickname] = useState(
    edit && existingLabel !== 'home' && existingLabel !== 'work' ? stripEmojis(existingLabel) : ''
  );
  const [loading, setLoading] = useState(false);
  const {setMapStyle} = useMapStyleStore();

  // Get location data from route params
  const locationData = placeData;

  console.log(locationData,"locationData")

  const saveOptions = [
    { key: 'home', label: t('home'),  },
    { key: 'work', label: t('work'), },
    { key: 'nickname', label: t('other'), },
  ];

  useEffect(() => {
    if(selectedOption !== 'nickname'){
      setMapStyle({
        height: height*0.7,
        width:"100%",
      });
    }else{
      setMapStyle({
        height: height*0.6,
        width:"100%",
      });
    }
  }, [selectedOption]);

  // Add marker when component mounts
  useEffect(() => {
    if (placeData && placeData.latitude && placeData.longitude) {
      const marker = new Marker(
        'drop_point',
        utils.formatAddressName(placeData),
        placeData.longitude,
        placeData.latitude,
        'drop_point',
        64,
        false,
        0
        
      );
      
      setMapMarkers([marker]);
      setMapLocation({lng:placeData.longitude,lat:placeData.latitude,zoom:25});
      setMapStyle({
        height: height*0.6,
        width:"100%",
      });
      // Cleanup function to remove marker when component unmounts
      return () => {
        setMapMarkers(null);
        setMapStyle({
          height:"100%",
          width:"100%",
        });
      };
    }
  }, [placeData, setMapMarkers]);

  const renderSaveOption = (option) => {
    const isSelected = selectedOption === option.key;
    return (
      <TouchableOpacity
        key={option.key}
        style={[
          styles.saveOptionButton,
          isSelected && styles.saveOptionButtonSelected,
        ]}
        onPress={() => setSelectedOption(option.key)}
      >
        <Text style={styles.saveOptionIcon}>{option.icon}</Text>
        <Text
          style={[
            styles.saveOptionText,
            isSelected && styles.saveOptionTextSelected,
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const handlePlaceSave = async () => {
    setLoading(true);
    const label = selectedOption === 'nickname' ? nickname : selectedOption;
    try {
      if (edit) {
        await handleSavePlace(locationData, label, placeData.favPlaceId);
      } else {
        await handleSavePlace(locationData, label);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if save button should be disabled
  const isSaveDisabled =
    (selectedOption === 'nickname' && !nickname.trim()) || loading;

  return (
    <>
    <NavBar withBg={false} onBackPress={() => goBack()} title={edit ? t('edit_place') : t('add_place')} />
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <AdaptiveText style={styles.sectionTitle}>
            {t('address')}
        </AdaptiveText>
        {/* Location Display */}
        <View style={styles.locationContainer}>
          <View style={styles.locationIcon}>
            <View style={styles.locationDot} />
          </View>
          <View style={styles.locationTextContainer}>
            {locationData.placeName && <AdaptiveText style={styles.locationTitle}>{utils.capitalizeFirstLetter(locationData.placeName)}</AdaptiveText>}
            {locationData.address && <AdaptiveText style={styles.locationSubtitle}>{utils.formatArrayAddress(locationData.address)}</AdaptiveText>}
           
          </View>
        </View>

        {/* Save As Section */}
        <View style={styles.section}>
          <AdaptiveText style={styles.sectionTitle}>{t('save_as')}</AdaptiveText>
          <View style={styles.saveOptionsContainer}>
            {saveOptions.map(renderSaveOption)}
          </View>
        </View>

        {/* Nickname Input - Show only when nickname is selected */}
        {selectedOption === 'nickname' && (
          <View style={styles.section}>
            <AdaptiveText style={styles.sectionTitle}>{t('custom_nickname')}</AdaptiveText>
            <TextInput
              style={styles.input}
              placeholder={t('enter_nickname_placeholder')}
              value={nickname}
              onChangeText={(text) => setNickname(stripEmojis(text))}
              placeholderTextColor="#999"
            />
          </View>
        )}

        

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            isSaveDisabled && styles.saveButtonDisabled,
          ]}
          onPress={handlePlaceSave}
          disabled={isSaveDisabled}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <AdaptiveText
              style={[
                styles.saveButtonText,
                isSaveDisabled && styles.saveButtonTextDisabled,
              ]}
              color={isSaveDisabled ? '#999' : '#fff'}
            >
              {edit ? t('update_place') : t('save_place')}
            </AdaptiveText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position:'absolute',
    borderTopLeftRadius:20,
    borderTopRightRadius:20,
    elevation:10,
   left:0,
   right:0,
   bottom:0,
    backgroundColor: '#fff',
  },
  locationSubtitle:{
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#666',
    lineHeight: 20,
  },
  scrollContent: {
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
   
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 20,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  locationContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5dc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#333',
    marginBottom: 4,
  },
 
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#333',
    marginBottom: 12,
    paddingLeft:10,
  },
  saveOptionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  saveOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
 
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
  },
  saveOptionButtonSelected: {
    backgroundColor: 'black',
    borderColor: '#f5f5dc',
  },
  saveOptionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  saveOptionText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#333',
  },
  saveOptionTextSelected: {
    color: '#fff',
  },
  input: {
    fontFamily: Fonts.regular,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#d6d6d6',
    backgroundColor: '#fafafa',
    minHeight: 48,

  },
  saveButton: {
    backgroundColor: 'black',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    fontFamily: Fonts.bold,
    marginTop: 10,
    
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
});

AddPlaceDetailScreen.propTypes = {
  placeData: PropTypes.object.isRequired,
  handleSavePlace: PropTypes.func.isRequired,
  edit: PropTypes.bool,
  existingLabel: PropTypes.string,
};

AddPlaceDetailScreen.defaultProps = {
  edit: false,
};

export default AddPlaceDetailScreen;
