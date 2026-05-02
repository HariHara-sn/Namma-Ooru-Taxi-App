import { View } from 'react-native'
import React from 'react'
import DocumentCenter from './DriverDocumentCenter/DocumentCenter'
import NavBar from '../../common/components/NavBar'
import { useStackScreenStore } from '../../common/store/useStackScreenStore'
import UseBackButton from '../../common/hooks/UseBackButton'
import usePublicDriverStore from '../store/usePublicDriverStore'

const EditDocCenter = () => {
    const { goBack, setStackScreen} = useStackScreenStore();
    const {isApproved} = usePublicDriverStore();

    const onBackPress = () => {
         if (isApproved) {
          goBack()
         } else {
          setStackScreen('DriverApprovalScreen');
         }
    }

  return (
    <View style={{flex:1, backgroundColor:'white'}}>
        <NavBar title="Document Center" onBackPress={() => onBackPress()} />
            <UseBackButton onBackPress={() => onBackPress()} />
      <DocumentCenter isEditMode />
    </View>
  )
}

export default EditDocCenter