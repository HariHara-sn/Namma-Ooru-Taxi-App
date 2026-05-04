import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera } from 'react-native-camera-kit';
import RNFS from 'react-native-fs';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { Colors, colors, Fonts } from '../../common/constants/constants';
import { checkCameraPermission, RequestCameraPermission } from '../../common/controllers/PermissionHandler';
import CameraIcon from '../../common/assets/icons/CameraIcon.svg';
import GalleryIcon from '../../common/assets/icons/Gallery.svg';
import { getPresignedImageUrl } from '../../common/utils/getPresignedImageUrl';
import useUserStore from '../../common/store/useUserStore';
import APIRequest from '../../common/controllers/APIRequest';
import { useTranslation } from 'react-i18next';
import Entypo from 'react-native-vector-icons/Entypo'

const PRE_SCAN_ENABLED_TYPES = new Set(['VEHICLE_RC', 'DRIVING_LICENSE']);

const pickerOptions = {
  mediaType: 'photo',
  presentationStyle: 'fullScreen',
  includeBase64: true,
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.8,
};

const DEFAULT_PRE_SCAN_ENDPOINT = '/publicrides/driver/v2/scanDoc';

const DocumentImageScanner = ({
  onScanComplete,
  onImageSelected,
  browseLabel = 'Browse',
  cameraLabel = 'Camera',
  containerStyle = {},
  buttonStyle = {},
  scannerTitle = 'Upload or capture document',
  helperText = 'The app will scan the image and extract readable text.',
  disabled = false,
  disabledMessage = 'Select a document type to enable scanning.',
  documentType = null,
  documentLabel = null,
  initialImage = null, // can be string URL or { uri, ... }
  preScanEndpoint = DEFAULT_PRE_SCAN_ENDPOINT,
  preScanMethod = 'POST',
  cameraType = 'back',
}) => {
  const [isBusy, setBusy] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [presignedUrl, setPresignedUrl] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);

  const {t} = useTranslation()

  const {userInfo} = useUserStore();
  const authToken = userInfo?.token;
  const cameraRef = useRef(null);
  const normalizedCameraType = useMemo(() => (cameraType === 'front' ? 'front' : 'back'), [cameraType]);

  const buildAssetPayload = useCallback(asset => ({
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || 'document.jpg',
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
  }), []);

  const recogniseText = useCallback(async uri => {
    // Run ML Kit text recognition on the captured image URI.
    const result = await TextRecognition.recognize(uri);
    if (!result) {
      return { text: '' };
    }

    const blocks = Array.isArray(result.blocks) ? result.blocks : [];
    const blockText = blocks
      .map(block => block?.text?.trim?.())
      .filter(Boolean)
      .join('\n');
    const extractedText = result.text?.trim?.() || blockText;

    return {
      text: extractedText,
      raw: result,
    };
  }, []);

  const processAsset = useCallback(async asset => {
    setBusy(true);
    setErrorMessage(null);

    try {
      const payload = buildAssetPayload(asset);
      setSelectedImage(payload);
      onImageSelected?.(payload);

      const resolvedDocTypeRaw = documentType
        ? `${documentType}`.trim()
        : `${documentLabel || 'UNKNOWN'}`.trim();
      const normalizedDocType = resolvedDocTypeRaw
        ? resolvedDocTypeRaw.replace(/\s+/g, '_').toUpperCase()
        : 'UNKNOWN';
      const isScanAllowed = PRE_SCAN_ENABLED_TYPES.has(normalizedDocType);
      const shouldRunPreScan = Boolean(preScanEndpoint) && isScanAllowed;

      const detectScanLimitReached = candidate => {
        if (!candidate) {
          return false;
        }

        const status =
          candidate?.status ??
          candidate?.code ??
          candidate?.httpStatus ??
          candidate?.response?.status ??
          candidate?.data?.status ??
          candidate?.response?.data?.status ??
          null;

        const messageCandidates = [
          candidate?.message,
          candidate?.error,
          candidate?.errorMessage,
          candidate?.response?.data?.message,
          candidate?.response?.data?.error,
          candidate?.data?.message,
          candidate?.data?.error,
        ];

        const normalizedMessage = messageCandidates
          .map(entry => (typeof entry === 'string' ? entry.trim().toLowerCase() : ''))
          .find(Boolean);

        const normalizedToken = normalizedMessage ? normalizedMessage.replace(/\s+/g, '_') : '';

        return status === 429 || normalizedMessage === 'max_scan_reached' || normalizedToken === 'max_scan_reached';
      };

      let preScanResponse = null;
      let scanLimitReached = false;

      if (shouldRunPreScan) {
        const base64Image = asset.base64;
        if (base64Image) {
          try {
            const serverResponse =
              typeof preScanEndpoint === 'function'
                ? await preScanEndpoint({
                    docType: normalizedDocType,
                    image: base64Image,
                    asset,
                    payload,
                  })
                : await new APIRequest().request(
                    preScanEndpoint,
                    preScanMethod,
                    {
                      docType: normalizedDocType,
                      documentType: normalizedDocType,
                      image: base64Image,
                    },
                    authToken,
                  );

                  console.log('Pre-scan server response:', JSON.stringify(serverResponse));

            preScanResponse = serverResponse;
            scanLimitReached = detectScanLimitReached(serverResponse);

            if (serverResponse?.success && !scanLimitReached) {
              const extractedText =
                serverResponse?.data?.text ??
                serverResponse?.data?.extractedText ??
                serverResponse?.data?.recognizedText ??
                '';

              const remoteResult = {
                text: extractedText,
                raw: serverResponse,
              };

              setScanResult(remoteResult);
              onScanComplete?.({
                image: payload,
                text: remoteResult.text,
                raw: serverResponse,
                preScanResponse: serverResponse,
                scanLimitReached: false,
              });
              return;
            }

            if (scanLimitReached) {
              console.info('Pre-scan limit reached. Falling back to on-device recognition.');
              preScanResponse = null;
            }
          } catch (error) {
            preScanResponse = error?.response?.data ?? error?.data ?? null;
            scanLimitReached = detectScanLimitReached(error) || detectScanLimitReached(preScanResponse);

            if (scanLimitReached) {
              console.info('Pre-scan limit reached during request. Falling back to on-device recognition.');
              preScanResponse = null;
            } else {
              console.warn('Document pre-scan failed', error);
            }
          }
        } else {
          console.warn('Pre-scan requested but base64 data is unavailable.');
        }
      } else if (preScanEndpoint) {
        console.info(`Pre-scan skipped for document type ${normalizedDocType}.`);
      }

      if (!isScanAllowed) {
        setScanResult(null);
        onScanComplete?.({
          image: payload,
          text: '',
          raw: null,
          preScanResponse: null,
          scanLimitReached: false,
        });
        return;
      }

      const recognition = await recogniseText(asset.uri);
      setScanResult(recognition);
      onScanComplete?.({
        image: payload,
        text: recognition.text,
        raw: recognition.raw,
        preScanResponse,
        scanLimitReached,
      });
    } catch (error) {
      setErrorMessage('Unable to read the image. Try again with a clearer photo.');
      setScanResult(null);
    } finally {
      setBusy(false);
    }
  }, [
    buildAssetPayload,
    documentLabel,
    documentType,
    onImageSelected,
    onScanComplete,
    preScanEndpoint,
    preScanMethod,
    recogniseText,
    authToken,
  ]);

  const closeCamera = useCallback(() => {
    setCameraVisible(false);
    setBusy(false);
  }, [setBusy]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const captureResult = await cameraRef.current.capture({
        flash: 'auto',
        quality: pickerOptions.quality,
        imageType: 'jpg',
        base64: true,
      });

      if (!captureResult?.uri) {
        return;
      }

      const resolvedUri = captureResult.uri.startsWith('file://')
        ? captureResult.uri
        : `file://${captureResult.uri}`;

      let base64Payload = captureResult.base64;
      if (!base64Payload) {
        try {
          const fsPath = resolvedUri.replace('file://', '');
          base64Payload = await RNFS.readFile(fsPath, 'base64');
        } catch (readError) {
          console.warn('Camera base64 read failed', readError);
        }
      }

      let fileSize = captureResult.size;
      if (!fileSize) {
        try {
          const stat = await RNFS.stat(resolvedUri.replace('file://', ''));
          fileSize = Number(stat.size);
        } catch (statError) {
          fileSize = null;
        }
      }

      const assetPayload = {
        uri: resolvedUri,
        width: captureResult.width,
        height: captureResult.height,
        base64: base64Payload,
        fileName: captureResult.name || `capture_${Date.now()}.jpg`,
        fileSize,
        type: 'image/jpeg',
      };

      closeCamera();
      await processAsset(assetPayload);
    } catch (error) {
      console.warn('Camera capture failed', error);
      setErrorMessage('Unable to capture image. Please try again.');
    }
  }, [closeCamera, processAsset, setErrorMessage]);

  const runImagePicker = useCallback(async source => {
    if (disabled) {
      setErrorMessage(null);
      return;
    }

    setErrorMessage(null);

    if (source === 'camera') {
      try {
        const hasPermission = await checkCameraPermission();
        let permissionGranted = hasPermission;

        if (!permissionGranted) {
          permissionGranted = await RequestCameraPermission();
        }

        if (!permissionGranted) {
          return;
        }

        setCameraVisible(true);
      } catch (error) {
        console.warn('Camera permission error', error);
        setErrorMessage('Unable to open the camera. Please retry.');
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);

    try {
      launchImageLibrary({ ...pickerOptions }, response => {
        if (response?.didCancel) {
          setBusy(false);
          return;
        }

        if (response?.errorCode) {
          console.warn('Image picker error', response.errorMessage);
          setErrorMessage('Unable to open the picker. Please retry.');
          setBusy(false);
          return;
        }

        const asset = response?.assets?.[0];
        if (!asset?.uri) {
          setErrorMessage('No image returned by picker.');
          setBusy(false);
          return;
        }

        processAsset(asset);
      });
    } catch (error) {
      console.warn('Image picker exception', error);
      setErrorMessage('Something went wrong. Try again.');
      setBusy(false);
    }
  }, [disabled, processAsset]);

  const helper = useMemo(() => helperText?.trim?.(), [helperText]);
  const displayUri = useMemo(() => {
    if (selectedImage?.uri) return selectedImage.uri;
    if (presignedUrl) return presignedUrl;
    return null;
  }, [selectedImage, presignedUrl]);
  const activeDocumentLabel = documentLabel || documentType;

  useEffect(() => {
    // Reset image load state when the source changes
    setImageError(false);
  }, [displayUri]);

  useEffect(() => {
    let isMounted = true;

    const resolveInitialImage = async () => {
      setImageError(false);

      if (!initialImage) {
        if (isMounted) {
          setPresignedUrl(null);
        }
        return;
      }

      const rawUri = typeof initialImage === 'string'
        ? initialImage.trim()
        : initialImage?.uri || initialImage?.url || '';

      if (!rawUri) {
        if (isMounted) {
          setPresignedUrl(null);
        }
        return;
      }

      const lowerUri = rawUri.toLowerCase();
      const isLocalSource = lowerUri.startsWith('file:') || lowerUri.startsWith('content:') || lowerUri.startsWith('data:');

      if (isLocalSource) {
        if (isMounted) {
          setPresignedUrl(rawUri);
        }
        return;
      }

      let objectKey = rawUri;
      if (rawUri.startsWith('http')) {
        try {
          const urlInstance = new URL(rawUri);
          objectKey = decodeURIComponent(urlInstance.pathname.replace(/^\//, ''));
        } catch (error) {
          objectKey = rawUri.replace(/^https:\/\/[^/]+\//, '');
        }
      }

      const presigned = await getPresignedImageUrl(objectKey, userInfo?.token);

      if (!isMounted) {
        return;
      }

      if (presigned) {
        setPresignedUrl(presigned);
        return;
      }

      if (rawUri.startsWith('http')) {
        setPresignedUrl(rawUri);
      } else {
        setPresignedUrl(null);
      }
    };

    resolveInitialImage();

    return () => {
      isMounted = false;
    };
  }, [initialImage, userInfo?.token]);

  return (
    <>
      <Modal
        visible={cameraVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeCamera}
      >
        <View style={styles.cameraModal}>
          <Camera
            ref={cameraRef}
            style={styles.cameraPreview}
            cameraType={normalizedCameraType}
            focusMode="on"
            zoomMode="on"
            flashMode="auto"
          />
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.cameraCancelButton} onPress={closeCamera}>
              <Text style={styles.cameraCancelText}>{t('Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButtonOuter} onPress={handleCapture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <View style={styles.cameraPlaceholder} />
          </View>
        </View>
      </Modal>

      <View style={[styles.container, containerStyle]}>
        {disabled ? (null):(<>
         <View style={styles.headerRow}>
        <Text style={styles.title}>{scannerTitle}</Text>
        {isBusy && <ActivityIndicator size="small" color={Colors.periwinkle} />}
      </View>
      {activeDocumentLabel ? <Text style={styles.typeIndicator}>Selected: {activeDocumentLabel}</Text> : null}
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
        </>)}
     
      <View style={styles.previewSurface}>
        <TouchableOpacity style={styles.eyeIcon} onPress={() => displayUri && !imageError && setShowImageModal(true)}>
          <Entypo name={'eye'} color={Colors.black} size={18} />
          <Text style={styles.eyeIconTxt}>{t('View')}</Text>
        </TouchableOpacity>
        {displayUri && !imageError ? (
          <>
            {imageLoading && (
              <View style={styles.previewOverlay}>
              <ActivityIndicator size="small" color={Colors.periwinkle} style={styles.previewLoader} />

              </View>
            )}
            <Image
              source={{ uri: displayUri }}
              style={styles.previewImage}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          </>
        ) : displayUri && imageError ? (
          <Text style={styles.placeholder}>Image failed to load. Please try again.</Text>
        ) : (
          <Text style={styles.placeholder}>No image selected yet.</Text>
        )}
        {isBusy ? (
          <View style={styles.previewOverlay}>
            <ActivityIndicator size="large" color={Colors.periwinkle} />
            <Text style={styles.overlayText}>Processing document...</Text>
          </View>
        ) : null}
      </View>

      {/* Modal for full image view */}
      {/* Use Modal component for image view to avoid overlay issues */}
      <Modal
        visible={showImageModal && !!displayUri && !imageError}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 1000 }}
            onPress={() => setShowImageModal(false)}
            accessibilityLabel="Close image modal"
          >
            <Entypo name={'cross'} color={'#fff'} size={32} />
          </TouchableOpacity>
          <Image
            source={{ uri: displayUri }}
            style={{ width: '95%', height: '80%', resizeMode: 'contain', borderRadius: 12 }}
          />
        </View>
      </Modal>

      {/* {scanResult?.text ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Detected Text</Text>
          <Text style={styles.resultContent}>{scanResult.text}</Text>
        </View>
      ) : null} */}

      {/* {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null} */}
      {/* {disabled && !errorMessage ? <Text style={styles.disabledHelper}>{disabledMessage}</Text> : null} */}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.leftActionButton,
            buttonStyle,
            (disabled || isBusy) && styles.disabledActionButton,
          ]}
          onPress={() => runImagePicker('gallery')}
          disabled={disabled || isBusy}
        >
          <GalleryIcon width={24} height={24} />
          <Text style={styles.actionButtonText}>{browseLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.rightActionButton,
            buttonStyle,
            (disabled || isBusy) && styles.disabledActionButton,
          ]}
          onPress={() => runImagePicker('camera')}
          disabled={disabled || isBusy}
        >
          <CameraIcon width={24} height={24} />
          <Text style={styles.actionButtonText}>{cameraLabel}</Text>
        </TouchableOpacity>
      </View>
      </View>
    </>
  );
};

export default DocumentImageScanner;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.periwinkle,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.black,
  },
  helper: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.cool_grey,
  },
  typeIndicator: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.periwinkle,
    marginBottom: 4,
  },
  previewSurface: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: Colors.grey_light,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  overlayText: {
    marginTop: 12,
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.cool_grey,
    textAlign: 'center',
  },
  placeholder: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.cool_grey,
  },
  resultBox: {
    backgroundColor: Colors.grey_light,
    borderRadius: 12,
    padding: 12,
  },
  resultTitle: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.black,
    marginBottom: 8,
  },
  resultContent: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.black,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.red,
  },
  disabledHelper: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: Colors.cool_grey,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginHorizontal: -8,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.grey_light,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  leftActionButton: {
    marginHorizontal: 8,
  },
  rightActionButton: {
    marginHorizontal: 8,
  },
  actionButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.black,
    marginLeft:8
  },
  disabledActionButton: {
    opacity: 0.6,
  },
  cameraModal: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraCancelButton: {
    minWidth: 86,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cameraCancelText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
  },
  captureButtonOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.white,
  },
  cameraPlaceholder: {
    width: 86,
  },
  eyeIcon:{
    position:'absolute',
    top:10,
    right:10,
    zIndex:1,
    backgroundColor:Colors.grey_dark,
    paddingVertical:4,
    paddingHorizontal:10,
    borderRadius:10,
    elevation:5,
    flexDirection:'row',
    gap:5,
  },
  eyeIconTxt:{
    fontFamily:Fonts.regular,
    color:Colors.black
  }
});


