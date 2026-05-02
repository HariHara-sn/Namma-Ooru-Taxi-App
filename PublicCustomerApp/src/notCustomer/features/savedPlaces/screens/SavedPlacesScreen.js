import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import { addFavoritePlace, deleteFavoritePlace } from '../../../API/EndPoints/EndPoints';
import { showNotification } from '../../../components/NotificationManger';
import useUserInfoStore from '../../../../common/store/useUserInfoStore';
import { utils } from '../../../utils/Utils';
import { Fonts } from '../../../constants/constants';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import { from } from '@apollo/client';

const SavedPlacesScreen = () => {
  const { t } = useTranslation();
  const {goBack,setStackScreen} = useStackScreenStore();
  const {userFavPlaces, setUserFavPlaces} = useUserInfoStore();
  const [deletingId, setDeletingId] = useState(null);

  
  const handleSavePlace = async (placeData,label) => {
    const payload = {
      locationData:placeData,
      label:label.toLowerCase()
    }
    try{
    const response = await addFavoritePlace(payload)

    if(response.success && response?.favPlaces?.length > 0){
      
      setUserFavPlaces(response?.favPlaces);
      
      // showNotification(t('success'),response.message);
      goBack();
    }else{
      showNotification(t('error'),response.error);
    }
  }catch(error){
    showNotification(t('error'),error.message);
  }
  }

  const handleSearchCallback = (location) => {
    goBack();
    setStackScreen('AddPlaceDetailScreen',{
      placeData:location,
      edit:false,
      handleSavePlace:handleSavePlace
    });
  }

  const handleAddPlace = () => {
    // setStackScreen('SearchScreen',{
    //   onSearchClick: handleSearchCallback,
    //   searchType:'savedPlaces',
    //   label:t('locate_places_to_save')
    // });

    const props = {
      onPickLocationResultCallback:handleSearchCallback,
      locationType:'savedPlaces',
      label: t('locate_places_to_save'),
    
      searchBar:true,
      focusSearchOnMount:true,
    }
    setStackScreen('PickLocationScreen', props);
  };

  const handlePlacePress = (place) => {
    // Navigate to booking screen with the selected place as destination
    const locationData = place.locationData;

    console.log("locationData",locationData)
    const destinationData = {
      name: locationData.name|| utils.formatAddressName(locationData),
      placeName: locationData.placeName || utils.formatAddressName(locationData),
      address: locationData.address || [],
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      type: 'DESTINATION_LOCATION',
      locationFrom: locationData.locationFrom || 'SAVED_PLACE'
    };

    console.log("destinationData",destinationData)
    
    setStackScreen('PlanRideScreen', {
      selectedDestination: destinationData,
      fromSavedPlaces: true
    });
  };

  const handleDeletePlace = async (placeToDelete) => {
    
    Alert.alert(
      t('delete_place'),
      `${t('delete_place_confirmation')} "${placeToDelete.label}"?`,
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete_place'),
          style: 'destructive',
          onPress: async () => {
            setDeletingId(placeToDelete.favPlaceId);
            try {
              const payload = {
                favPlaceId: placeToDelete.favPlaceId, // Use favPlaceId for deletion
               
              };
             
              
              const response = await deleteFavoritePlace(payload);
           
              if (response.success && response?.favPlaces) {
               
                setUserFavPlaces(response?.favPlaces);
                // showNotification(t('success'), t('place_deleted_successfully'));
              } else {
                showNotification(t('error'), response.error || t('failed_to_delete_place'));
              }
            } catch (error) {
              console.error('Error deleting place:', error);
              showNotification(t('error'), t('failed_to_delete_place_try_again'));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleEditPlace = (placeToEdit) => {
    setStackScreen('AddPlaceDetailScreen', {
      placeData: {
        ...placeToEdit.locationData,
        originalLabel: placeToEdit.label,
        favPlaceId: placeToEdit.favPlaceId
      },
      edit: true,
      existingLabel: placeToEdit.label,
      handleSavePlace: handleUpdatePlace
    });
  };

  const handleUpdatePlace = async (placeData, newLabel,favPlaceId) => {
    
    try {
      
        const addPayload = {
          favPlaceId: favPlaceId,
          locationData: placeData,
          label: newLabel.toLowerCase()
        };
        
        const addResponse = await addFavoritePlace(addPayload);
        
        if (addResponse.success && addResponse?.favPlaces?.length > 0) {
          // Update local state using favPlaceId
          
          setUserFavPlaces(addResponse?.favPlaces);
          // showNotification(t('success'), t('place_updated_successfully'));
          goBack();
        } else {
          showNotification(t('error'), addResponse.error || t('failed_to_update_place'));
        }
      
    } catch (error) {
      console.error('Error updating place:', error);
      showNotification(t('error'), t('failed_to_update_place_try_again'));
    }
  };

  const getPlaceIcon = (label) => {
    switch(label.toLowerCase()) {
      case 'home':
        return 'home';
      case 'work':
        return 'briefcase';
      default:
        return 'star';
    }
  };

  const renderSavedPlace = (place, index) => {
    console.log('place',place);
    const locationData = place.locationData;
    // const address = locationData.address || 'Unknown Address';
    //  const name = locationData.name || utils.formatAddressName(locationData);
    
    return (
      <TouchableOpacity 
        key={index} 
        style={styles.placeCard}
        onPress={() => handlePlacePress(place)}
        activeOpacity={0.7}
      >
        <View style={styles.placeIconContainer}>
          <Ionicons 
            name={getPlaceIcon(place.label)} 
            size={24} 
            color="#0f223c" 
          />
        </View>
        <View style={styles.placeContent}>
          <AdaptiveText style={styles.placeLabel}>{place.label.charAt(0).toUpperCase() + place.label.slice(1)}</AdaptiveText>
          
          <Text style={styles.placeFullAddress} numberOfLines={1} ellipsizeMode="tail">
            {utils.formatAddressName(locationData)}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          {deletingId === place.favPlaceId ? (
            <ActivityIndicator size="small" color="#ff4444" />
          ) : (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePlace(place)}
              disabled={deletingId !== null}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={80} color="#ccc" />
      <AdaptiveText style={styles.emptyTitle}>{t('no_saved_places')}</AdaptiveText>
      <AdaptiveText style={styles.emptySubtitle}>{t('saved_places_empty_subtitle')}</AdaptiveText>
      <AdaptiveText style={styles.emptyDescription}>
        {t('saved_places_empty_description')}
      </AdaptiveText>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <AdaptiveText style={styles.headerTitle}>{t('saved_places')}</AdaptiveText>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {userFavPlaces && userFavPlaces.length > 0 ? (
          <View style={styles.placesList}>
            {userFavPlaces.map((place, index) => renderSavedPlace(place, index))}
          </View>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddPlace}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  placesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  placeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  placeContent: {
    flex: 1,
    marginRight: 12,
  },
  placeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
    fontFamily: Fonts.medium,
  },
  placeAddress: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 2,
    fontFamily: Fonts.regular,
  },
  placeFullAddress: {
    fontSize: 12,
    color: '#757575',
    fontFamily: Fonts.regular,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0f223c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default SavedPlacesScreen;