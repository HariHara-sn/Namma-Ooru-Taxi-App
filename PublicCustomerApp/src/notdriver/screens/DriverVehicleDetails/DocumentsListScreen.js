import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import { Colors, colors, Fonts } from '../../../common/constants/constants';
import usePublicDriverStore from '../../store/usePublicDriverStore';
import useUserStore from '../../../common/store/useUserStore';
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import { documentsList } from '../../../common/constants/jsonData';
import { showNotification } from '../../../common/components/Alerts/showNotification';
import publicrideDriverApi from '../../api/publicrideDriverApi';
import { getPresignedImageUrl } from '../../../common/utils/getPresignedImageUrl';
import DocWarning from '../../../notdriver/assets/icons/docWarning.svg';
import DocUpload from "../../../notdriver/assets/icons/docUpload.svg";
import { useTranslation } from 'react-i18next';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    height: '100%',
  },
  mainContentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  infoContainer: {
    marginTop: 20,
    backgroundColor: Colors.periwinkle_light,
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 5,
  },
  infoText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.black,
  },
  Listcontainer: {
    paddingTop: 10,
    paddingBottom: 20,
    width: '100%',
    alignSelf: 'center',
  },
  docBtn: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    backgroundColor: Colors.white_dirt,
    marginVertical: 10,
    alignItems: 'center',
    paddingRight: 10,
    borderRadius: 10,
  },
  pointer: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.white,
    backgroundColor: Colors.violet,
    borderRadius: 100,
    textAlign: 'center',
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.grey_light,
  },
  nextBtn: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Colors.violet,
    paddingVertical: 15,
    borderRadius: 10,

  },
  nextBtnText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
  },
  docName: {
    fontFamily: Fonts.light,
    fontSize: 16,
    color: Colors.black,
    width: '70%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    width: '90%',
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: Colors.black,
  },
  modalInfoContainer: {
    backgroundColor: Colors.periwinkle_light,
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    width: '90%',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginVertical: 15,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.grey_light,
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.grey_light,
    borderRadius: 10,
    marginVertical: 15,
  },
  uploadText: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.black,
    marginTop: 10,
  },
  modalButtonContainer: {
    marginTop: 15,
  },
  browseBtn: {
    backgroundColor: Colors.blue_xxlight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  browseBtnText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.violet,
  },
  uploadBtn: {
    backgroundColor: Colors.violet,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadBtnText: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.white,
  },
});

const DocumentsListScreen = ({ onNext, isEdit }) => {
  const { getDocumentById, isAllDocumentsUploaded, setDocumentFile, updateDocumentStatus } = usePublicDriverStore();
  const {userInfo} = useUserStore();
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false)
  const { setStackScreen } = useStackScreenStore();
  const [imagefile, setImageFile] = useState(null)
  const {t} = useTranslation()

  const onBackPress = () => {
    navigation.goBack();
  };

  const onSelectDoc = async (docId) => {
    setIsLoading(true);
    const documentName = documentsList.find(item => item.id === docId).name;
    const image = getDocumentById(docId).file;
    
    if (!image || !image.uri) {
      showNotification(`${documentName}`, `No image selected`, 'error');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append(docId, {
      uri: image.uri,
      name: image.name || `${docId}.jpg`,
      type: image.type || 'image/jpeg',
    });

    
    // Add timeout and retry logic
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const response = await publicrideDriverApi.uploadDriverDocuments(formData, userInfo?.token);
        console.log('hari-->>response-->>', response)
        if (response.success) {
          showNotification(`${t(documentName)}`, `Uploaded successfully`, 'success');
          setModalVisible(false);
          updateDocumentStatus(docId, 'uploaded');
          break;
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (error) {
        retryCount++;
        console.log(`Upload attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          showNotification(
            `${t(documentName)}`, 
            `Error uploading document: ${error?.message || 'Network request failed'}`, 
            'error'
          );
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    
    setIsLoading(false);
  };

  const handleChoosePhoto = () => {
    if (!selectedDoc) return;

    launchImageLibrary({ mediaType: 'photo' }, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorCode);
      } else if (response.assets) {
        const asset = response.assets[0];        
        // Check if image size is greater than 10MB
        if (asset.fileSize > 10 * 1024 * 1024) {
          showNotification(
            'Image too large',
            'Please select an image less than 10MB in size',
            'error'
          );
          return;
        }

        const imageFile = {
          uri: asset.uri,
          name: asset.fileName,
          type: asset.type,
        };
        setImageFile(null)
        setDocumentFile(selectedDoc.id, imageFile);
      }
    });
  };

  const onDocTypePress = item => {
    setSelectedDoc(item);
    setModalVisible(true);
    getImage(item)
  };

  const fetchImageFromUrl = async (imageUrl) => {
    try {
      setIsImageLoading(true);
      const key = imageUrl.replace(/^https:\/\/[^/]+\/?/, '');
      const response = await getPresignedImageUrl(key, userInfo?.token);
      setImageFile(response);
    } catch (error) {
      console.log("Failed to fetch image:", error);
    } finally {
      setIsImageLoading(false);
    }
  };

  const getImage = (item) => {
     const currentUri = getDocumentById(item?.id)?.file?.uri;
     const isE2EImage = currentUri?.includes('https://not-publicrides.objectstore.e2enetworks.net');
     if (isE2EImage) {
      fetchImageFromUrl(currentUri);
     } else {
      setImageFile(null)
     }
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.infoContainer}>
        <View>
          <Text style={styles.infoText}>Format: JPG / PNG / PDF</Text>
          <Text style={styles.infoText}>Size: Maximum 1MB each</Text>
          <Text style={styles.infoText}>Resolution: Maximum 2000px</Text>
        </View>
        <DocWarning />
      </View> */}
      <View style={styles.mainContentContainer}>
        <ScrollView contentContainerStyle={styles.Listcontainer}>
          {documentsList.map((item, index) => {
            return (
              <TouchableOpacity
                onPress={() => onDocTypePress(item)}
                key={index}
                style={styles.docBtn}>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    alignItems: 'center',
                    paddingLeft: 10,
                  }}>
                  <Text style={styles.pointer}>{index + 1}</Text>
                  <Text style={styles.docName}>{t(item.name) + (item.required ? '*' : '')}</Text>
                </View>
                {getDocumentById(item.id)?.status === 'uploaded' ? (
                  <MaterialIcons
                    name="check-circle"
                    color={Colors.green}
                    size={25}
                  />
                ) : (
                  <MaterialIcons
                    name="arrow-forward-ios"
                    color={Colors.black}
                    size={16}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.nextBtn,
            {
              backgroundColor: isAllDocumentsUploaded() ? Colors.violet : Colors.violet_disabled
            }
          ]}
          disabled={!isAllDocumentsUploaded()}
          onPress={()=>onNext()}
        >
          <Text style={styles.nextBtnText}>{t('done')}</Text>
        </TouchableOpacity>
      </View>

      {/* Document Upload Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t(selectedDoc?.name)}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            {!isEdit && (
            <View style={styles.modalInfoContainer}>
              <View>
                <Text style={styles.infoText}>{t('format')}: JPG / PNG / PDF</Text>
                <Text style={styles.infoText}>{t('size_maximum_photo')}: </Text>
                <Text style={styles.infoText}>{t('resolution_maximum_2000px')}</Text>
              </View>
              <DocWarning />
            </View>
            )}

            {selectedDoc && (getDocumentById(selectedDoc?.id)?.file?.uri || imagefile) ? (
  <View style={styles.imageContainer}>
    <Image
      style={styles.documentImage}
      resizeMode="contain"
      source={{ uri: imagefile ? imagefile : getDocumentById(selectedDoc?.id)?.file?.uri}}
    />
  </View>
) : (
  <View style={styles.uploadPlaceholder}>
    <DocUpload />
    <Text style={styles.uploadText}>{t('upload_document')}</Text>
  </View>
)}
            {!isEdit && (
                 <View style={styles.modalButtonContainer}>
                 <TouchableOpacity
                   style={styles.browseBtn}
                   onPress={handleChoosePhoto}>
                   <Text style={styles.browseBtnText}>
                     {selectedDoc && getDocumentById(selectedDoc.id)?.file ? t('change') : t('browse')}
                   </Text>
                 </TouchableOpacity>
   
                 {selectedDoc && getDocumentById(selectedDoc.id)?.file && getDocumentById(selectedDoc.id)?.status !== 'uploaded' && (
                   <TouchableOpacity
                     style={[
                       styles.uploadBtn,
                       { backgroundColor: isLoading ? Colors.violet_disabled : Colors.violet }
                     ]}
                     disabled={isLoading || imagefile}
                     onPress={() => onSelectDoc(selectedDoc.id)}>
                     {isLoading ? (
                       <ActivityIndicator size="small" color={Colors.white} />
                     ) : (
                       <Text style={styles.uploadBtnText}>{t('upload')}</Text>
                     )}
                   </TouchableOpacity>
                 )}
               </View>
            )}
           
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DocumentsListScreen;


