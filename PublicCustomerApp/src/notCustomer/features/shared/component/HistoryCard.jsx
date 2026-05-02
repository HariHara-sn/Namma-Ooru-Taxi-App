import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity ,Vibration} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { colors, Fonts } from '../../../constants/constants';
import { DataStore } from '../../../controllers/DataStore';

import { useTranslation } from 'react-i18next';
import CategoryIcon from '../../../components/Common/CategoryIcon';
import AdaptiveText from '../../../components/Common/AdaptiveText';
import {utils} from '../../../utils/Utils';
import { firebaselog_ridePlanning } from '../../../../common/utils/FirebaseAnalytics';



const HistoryCard = React.memo(({ selectCallback, header = true, bottomborder = true, fromSearchScreen = false ,fromHomeScreen = false}) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [showDeleteIndex, setShowDeleteIndex] = useState(null);
  const { t } = useTranslation();

  const setRecentSearches = useCallback(async () => {
    const recentSearches = await DataStore.loadData('recentSearches');
    setHistoryItems(recentSearches?.data || []);
    // console.log('Recent Searches:', recentSearches);
  }, []);

  useEffect(() => {
    setRecentSearches();
  }, [setRecentSearches]);

  const handleDelete = async (index) => {
    const updatedItems = historyItems.filter((_, i) => i !== index);
    setHistoryItems(updatedItems);
    setShowDeleteIndex(null);
    await DataStore.saveData('recentSearches', { data: updatedItems });
  };

  const handlePress = (item) => {
    firebaselog_ridePlanning('RP_Place_Select_Method(RP_PSM)', `RP_PSM:history`);
    selectCallback(item);
  }
  
  return (
    <View style={[styles.container, fromHomeScreen && styles.containerInHome]}>
      {(historyItems?.length > 0 && header) && <AdaptiveText style={fromHomeScreen?styles.titleInHome : styles.title}> {t('recent')}</AdaptiveText>}
      {historyItems?.length > 0 ? (
        historyItems.map((item, index) => (
          <View key={index}>
            <TouchableOpacity
              onPress={() => {handlePress(item)}}
              onLongPress={() => setShowDeleteIndex(index)}
              delayLongPress={400}
            >
              <View style={[styles.historyItem, bottomborder && { borderBottomWidth: index === historyItems.length - 1 ? 0 : 0.5 }]}> 
                <View style={styles.iconContainer}>
                  <CategoryIcon category={item.label} isFromHistory={true} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.name, fromSearchScreen && { fontSize: 15 }]} numberOfLines={1} ellipsizeMode="tail">{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</Text>
                  {item.address && <Text style={[styles.address, { fontSize: 14 }]} numberOfLines={1} ellipsizeMode="tail" color={colors.grey_xxdark}>{utils.formatArrayAddress(item.address)}</Text>}
                </View>
                {showDeleteIndex === index && (
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(index)}>
                    <Ionicons name="trash-outline" size={22} color="#e53935" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.noHistoryContainer}>
          <View style={styles.noHistoryIconContainer}>
            <Ionicons name="search-outline" size={40} color={"#757575"} />
          </View>
          <AdaptiveText style={styles.noHistoryText}>{t('no_recent_searches')}</AdaptiveText>
          <AdaptiveText style={styles.noHistorySubtext}>{t('your_recent_searches_will_appear_here')}</AdaptiveText>
        </View>
      )}
    </View>
  );
});

HistoryCard.displayName = 'HistoryCard';
HistoryCard.propTypes = {
  selectCallback: PropTypes.func.isRequired,
  header: PropTypes.bool,
  bottomborder: PropTypes.bool,
  fromSearchScreen: PropTypes.bool,
};


const styles = StyleSheet.create({
  container: {
    marginTop: 5,
    marginHorizontal: 15,
 
  },
  titleInHome:{
          // paddingLeft:10
        marginTop: 10,
        marginBottom: 5,
      
        fontSize: 18,
        fontFamily: Fonts.medium,
        color: "#969696ff",
  },
  containerInHome:{
    marginTop: 10,
    marginHorizontal: 7,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center', 
    paddingVertical: 10,

    borderBottomColor: colors.grey,
    gap: 15,
    marginBottom:5,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: '#212121',
  },
  address: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#757575',
    marginTop: 2,
    textTransform:"capitalize"
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: colors.black,
    marginBottom: 10,
  },
  noHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  noHistoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 15,
  },
  noHistoryText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: colors.black,
    marginBottom: 5,
  },
  noHistorySubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#757575",
    textAlign: 'center',
  },
});

export default HistoryCard;
