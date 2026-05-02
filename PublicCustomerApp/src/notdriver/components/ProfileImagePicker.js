import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'
import { Image } from 'react-native'
import useUserStore from '../../common/store/useUserStore'
import { checkCameraPermission, RequestCameraPermission } from '../../common/controllers/PermissionHandler'
import AlertModal from './AlertModal'
import FullScreenLoader from '../../common/loaders/FullScreenLoader'
import { Colors, Fonts } from '../../common/constants/constants'
import { getPresignedImageUrl } from '../../common/utils/getPresignedImageUrl'
import CameraIcon from '../../common/assets/icons/CameraIcon.svg'
import GalleryIcon from '../../common/assets/icons/Gallery.svg'

const ProfileImagePicker = ({
  imageFile, setImageFile,
  label = 'Upload Image (Helps users to identify the device)',
  cloudIcon = null,
  browseLabel = 'Browse',
  cameraLabel = 'Camera',
  buttonStyle = {},
  containerStyle = {},
  onImagePicked,
  includeBase64,
  isView
}) => {
    const [showModal, setShowModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const resolvedKeyRef = useRef(null)
    const resolvedOriginalRef = useRef(null)
    const [previewSource, setPreviewSource] = useState(() => {
      if (!imageFile) {
        return null;
      }
      if (typeof imageFile === 'string') {
        return null;
      }
      if (imageFile?.uri) {
        return imageFile;
      }
      return { uri: imageFile };
    })
    const {userInfo} = useUserStore()
    // const [neImage, setNewImage] = useState(imageFile)

    useEffect(() => {
      let isMounted = true;

      const resolveRemoteImage = async () => {
        if (!imageFile) {
          setPreviewSource(null);
          return;
        }

        if (typeof imageFile === 'object' && imageFile?.resolved) {
          setPreviewSource(imageFile);
          resolvedKeyRef.current = imageFile.key || imageFile.originalUrl || imageFile.uri || null;
          resolvedOriginalRef.current = imageFile.originalUrl || imageFile.uri || null;
          setIsLoading(false);
          return;
        }

        if (typeof imageFile === 'string' || imageFile?.key) {
          const rawUrl = typeof imageFile === 'string' ? imageFile : imageFile?.uri || '';
          const keySource = typeof imageFile === 'string' ? imageFile : imageFile?.key || rawUrl;
          const previousKey = resolvedKeyRef.current;
          if (keySource && previousKey && keySource === previousKey) {
            setPreviewSource(prev => {
              if (prev?.uri) {
                return prev;
              }
              if (typeof imageFile === 'object' && imageFile?.uri) {
                return imageFile;
              }
              const fallbackUri = resolvedOriginalRef.current || keySource;
              return fallbackUri ? { uri: fallbackUri } : null;
            });
            setIsLoading(false);
            return;
          }
          try {
            setIsLoading(true);
            const key = keySource?.replace(/^https?:\/\/[^/]+\/?/, '')?.replace(/^\//, '');
            if (!key) {
              if (typeof imageFile === 'string') {
                setPreviewSource({ uri: imageFile });
              } else if (imageFile?.uri) {
                setPreviewSource(imageFile);
              }
              setIsLoading(false);
              resolvedKeyRef.current = keySource || imageFile?.uri || null;
              resolvedOriginalRef.current = keySource || imageFile?.uri || null;
              return;
            }
            const response = await getPresignedImageUrl(key, userInfo?.token);
            if (!isMounted) {
              return;
            }

            const inferredName = (() => {
              if (typeof imageFile === 'object' && imageFile?.name) {
                return imageFile.name;
              }
              const lastSegment = keySource?.split('/')?.pop() || 'image.jpg';
              return lastSegment.split('?')[0] || 'image.jpg';
            })();

            const inferredType = (() => {
              const source = keySource?.toLowerCase() || '';
              if (source.endsWith('.pdf')) {
                return 'application/pdf';
              }
              if (source.endsWith('.png')) {
                return 'image/png';
              }
              if (source.endsWith('.webp')) {
                return 'image/webp';
              }
              return 'image/jpeg';
            })();

            const resolved = {
              uri: response,
              name: inferredName,
              type: inferredType,
              key,
              originalUrl: typeof imageFile === 'string' ? imageFile : imageFile?.uri || response,
              resolved: true,
            };

            setPreviewSource(resolved);
            if (setImageFile && (typeof imageFile !== 'object' || !imageFile?.resolved)) {
              setImageFile(resolved);
            }
            resolvedKeyRef.current = keySource;
            resolvedOriginalRef.current = resolved.originalUrl;
          } catch (error) {
            console.error('Error Fetching Image:', error);
            if (isMounted) {
              if (typeof imageFile === 'string') {
                setPreviewSource({ uri: imageFile });
              } else if (imageFile?.uri) {
                setPreviewSource(imageFile);
              }
              resolvedKeyRef.current = keySource || imageFile?.uri || null;
              resolvedOriginalRef.current = keySource || imageFile?.uri || null;
            }
          } finally {
            if (isMounted) {
              setIsLoading(false);
            }
          }
          return;
        }

        if (imageFile?.uri) {
          const resolvedLocal = typeof imageFile === 'object' && !imageFile?.resolved
            ? { ...imageFile, resolved: true }
            : imageFile;
          setPreviewSource(resolvedLocal);
          if (setImageFile && resolvedLocal !== imageFile) {
            setImageFile(resolvedLocal);
          }
          resolvedKeyRef.current = imageFile?.key || imageFile?.uri;
          resolvedOriginalRef.current = imageFile?.uri;
          return;
        }

        setPreviewSource({ uri: imageFile, resolved: true });
        resolvedKeyRef.current = imageFile;
        resolvedOriginalRef.current = imageFile;
      };

      resolveRemoteImage();

      return () => {
        isMounted = false;
      };
    }, [imageFile, setImageFile, userInfo?.token]);

    const openImagePicker = async () => {
        const options = {
          mediaType: 'photo',
          maxWidth: 800,
          maxHeight: 800,
          cropping: true,
          includeBase64: includeBase64,
        };
        try {
          await launchImageLibrary(options, response => {
            if (response.didCancel) {
              console.log('User cancelled image picker');
            } else if (response.error) {
              console.log('ImagePicker Error: ', response.error);
            } else {
              const asset = response.assets[0];
              const assetFile = {
                uri: includeBase64 ? `data:image/jpeg;base64,${asset.base64}`: asset.uri,
                type: asset.type || 'image/jpeg',
                name: asset.fileName || 'image.jpg',
                height: asset.height || 800,
                width: asset.width || 360,
                fileSize: asset.fileSize || 24404,
              }  
              const imageFile = assetFile
              setPreviewSource(imageFile)
              resolvedKeyRef.current = imageFile.key || imageFile.uri
              resolvedOriginalRef.current = imageFile.uri
              setImageFile(imageFile)
              if (onImagePicked) onImagePicked(imageFile)
              setShowModal(false);
            }
          });
        } catch (e) {
          console.log('LAUNCH GALLERY ERROR-->>', e);
        }
      };

    const openCamera = async () => {
        const hasCameraPermission = await checkCameraPermission()
        if(!hasCameraPermission){
            await RequestCameraPermission()
            return
        }
        const options = {
          mediaType: 'photo',
          maxWidth: 800,
          maxHeight: 800,
          cropping: true,
          includeBase64: includeBase64,
        };
        try {
          await launchCamera(options, response => {
            if (response.didCancel) {
              console.log('User cancelled image picker');
            } else if (response.error) {
              console.log('ImagePicker Error: ', response.error);
            } else {
              
              const asset = response.assets[0];
              const assetFile = {
                uri: includeBase64 ? `data:image/jpeg;base64,${asset.base64}`: asset.uri,
                type: asset.type || 'image/jpeg',
                name: asset.fileName || 'image.jpg',
                height: asset.height || 800,
                width: asset.width || 360,
                fileSize: asset.fileSize || 24404,
              }  
              const imageFile = assetFile
              setPreviewSource(imageFile)
              resolvedKeyRef.current = imageFile.key || imageFile.uri
              resolvedOriginalRef.current = imageFile.uri
              setImageFile(imageFile)
              if (onImagePicked) onImagePicked(imageFile)
              setShowModal(false);
            }
          });
        } catch (e) {
          console.log('LAUNCH CAMERA ERROR-->>', e);
        }
      };

    const onUploadPress = () => {
        setShowModal(true)
    }

  let timeoutId;

  const uploadImage = type => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsLoading(true);
    setShowModal(false);
    timeoutId = setTimeout(() => {
      if (type === 'camera') {
        openCamera();
      } else {
        openImagePicker();
      }
      setIsLoading(false);
    }, 1000);
  };

    const renderModal = () => {
        return (
            <AlertModal
            isVisible={showModal}
            onClose={() => {
              setShowModal(false)
            }}
            isLoading={isLoading}
            leftBtnTxt={'Cancel'}
            animationType={'slide'}
            >
               <View style={styles.modalContent}>
                <TouchableOpacity style={[styles.modalButton, buttonStyle]} onPress={()=>uploadImage('gallery')}>
                    <GalleryIcon width={24} height={24} />
                    <Text style={styles.modalButtonText}>{browseLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, buttonStyle]} onPress={()=>uploadImage('camera')}>
                    <CameraIcon width={24} height={24} />
                    <Text style={styles.modalButtonText}>{cameraLabel}</Text>
                </TouchableOpacity>
               </View>
            </AlertModal>
        )
    }

   return (
    <View style={[styles.uploadContainer, containerStyle]}>
      {cloudIcon && <View style={styles.cloudIcon}>{cloudIcon}</View>}
      <Text style={styles.title}>{label}</Text>
      <View style={styles.imageContainer}>
        {isLoading && <FullScreenLoader />}
        {previewSource ?
        <>
         <Image source={{uri: previewSource?.uri}} style={styles.image} />
         {!isView && 
          <TouchableOpacity onPress={()=>onUploadPress()} style={{marginTop:10}}>
          <Text style={styles.imageText}>Re Upload</Text>
          </TouchableOpacity>
         }
        </>: 
          (
            !isView && (
            <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.actionButton, buttonStyle]} onPress={()=>uploadImage('gallery')}>
              <GalleryIcon width={24} height={24} />
              <Text style={styles.actionButtonText}>{browseLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, buttonStyle]} onPress={()=>uploadImage('camera')}>
              <CameraIcon width={24} height={24} />
              <Text style={styles.actionButtonText}>{cameraLabel}</Text>
            </TouchableOpacity>
          </View>
           )
         
        )}
      </View>
      {showModal && renderModal()}
    </View>
  )
}

export default ProfileImagePicker

const styles = StyleSheet.create({
    uploadContainer: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.periwinkle,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 10,
        padding: 24,
    },
    cloudIcon: {
        marginBottom: 12,
    },
    title:{
        fontFamily:Fonts.medium,
        fontSize:16,
        color:Colors.black,
        textAlign: 'center',
        marginBottom: 8,
    },
    imageContainer:{
        width:'100%',
        alignItems:'center',
        justifyContent:'center',
        marginTop:10,
        marginBottom: 10,
        borderRadius:10,
        overflow:'hidden'
    },
    imageText:{
        fontFamily:Fonts.medium,
        fontSize:14,
        color:Colors.periwinkle,
    },
    modalContent:{
        flexDirection:'row',
        justifyContent:'space-between',
        width:'100%',
        padding:10,
    },
    modalButton:{
        width:'48%',
        padding:10,
        borderRadius:10,
        borderWidth:1,
        borderColor:Colors.periwinkle,
        alignItems:'center',
        justifyContent:'center',
        gap:10,
    },
    modalButtonText:{
        fontFamily:Fonts.medium,
        fontSize:12,
        color:Colors.periwinkle,
        textAlign:'center',
    },
    image:{
        width:100,
        height:100,
        borderRadius:10,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.grey_light,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        width: '48%',
        gap: 8,
    },
    actionButtonText: {
        fontFamily: Fonts.medium,
        fontSize: 14,
        color: Colors.black,
        marginLeft: 8,
    },
})