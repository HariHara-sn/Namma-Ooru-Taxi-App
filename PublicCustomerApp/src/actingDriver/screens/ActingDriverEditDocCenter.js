import {StyleSheet, View} from 'react-native';
import React from 'react';
import {useStackScreenStore} from '../../common/store/useStackScreenStore';
import UseBackButton from '../../common/hooks/UseBackButton';
import NavBar from '../../common/components/NavBar';
import ActingDriverDocumentCenter from './ActingDriverDocumentCenter';
import {Colors} from '../../common/constants/constants';

const ActingDriverEditDocCenter = () => {
  const {goBack} = useStackScreenStore();

  return (
    <View style={styles.screen}>
      <UseBackButton onBackPress={goBack} />
      <NavBar title="Document Center" onBackPress={goBack} />
      <ActingDriverDocumentCenter isEditMode />
    </View>
  );
};

export default ActingDriverEditDocCenter;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});
