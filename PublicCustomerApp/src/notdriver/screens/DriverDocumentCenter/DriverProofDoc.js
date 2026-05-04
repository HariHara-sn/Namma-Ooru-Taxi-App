import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import NavBar from '../../../common/components/NavBar';
import DocumentImageScanner from '../../components/DocumentImageScanner';
import usePublicDriverStore from '../../store/usePublicDriverStore';
import { Colors, colors, Fonts } from '../../../common/constants/constants';
import { useStackScreenStore } from '../../../common/store/useStackScreenStore';
import publicrideDriverApi from '../../api/publicrideDriverApi';
import { showNotification } from '../../../common/components/Alerts/showNotification';
import useUserStore from '../../../common/store/useUserStore';
import UseBackButton from '../../../common/hooks/UseBackButton';
import { firebaselog_onBoarding } from '../../../common/utils/FirebaseAnalytics';
import FullScreenLoader from '../../../common/loaders/FullScreenLoader';

const aadhaarPattern = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
const aadhaarDigitsPattern = /^\d{12}$/;
const panPattern = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/i;

const formatAadhaar = value => {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (!digits) {
    return '';
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

const DriverProofDoc = (props) => {
  const { t } = useTranslation();
  const { goBack } = useStackScreenStore();
  const {isEdit} = props
  const {
    driverInfo,
    setDriverInfo,
    setDocumentFile,
    updateDocumentStatus,
    aadhaarDocEntry,
    panDocEntry,
  } = usePublicDriverStore(state => {
    const aadhaarDocEntry = state.documents.find(doc => doc.id === 'aadhar') || null;
    const panDocEntry = state.documents.find(doc => doc.id === 'panCard') || null;

    return {
      driverInfo: state.driverInfo,
      setDriverInfo: state.setDriverInfo,
      setDocumentFile: state.setDocumentFile,
      updateDocumentStatus: state.updateDocumentStatus,
      aadhaarDocEntry,
      panDocEntry,
    };
  });
  
  const { userInfo } = useUserStore();

  const {setDocumentsCompleteStatus} = usePublicDriverStore();

  const [activeTab, setActiveTab] = useState('aadhaar');
  const [aadhaarNumber, setAadhaarNumber] = useState(driverInfo?.aadharNo || '');
  const [panNumber, setPanNumber] = useState(driverInfo?.panNo || '');

  // Store initial values for change detection
  const initialProofRef = useRef(null);
  useEffect(() => {
    if (!initialProofRef.current) {
      initialProofRef.current = {
        aadharNo: driverInfo?.aadharNo || '',
        panNo: driverInfo?.panNo || '',
        aadharDocument: driverInfo?.aadharDocument || null,
        panDocument: driverInfo?.panDocument || null,
      };
    }
  }, [driverInfo]);

  // Helper to compare current values with initial values
  const isAadhaarChanged = () => {
    const initial = initialProofRef.current;
    if (!initial) return false;
    return (
      aadhaarNumber !== initial.aadharNo ||
      (pendingImage.aadhar?.uri || aadharDocument?.uri || '') !== (initial.aadharDocument?.uri || '')
    );
  };
  const isPanChanged = () => {
    const initial = initialProofRef.current;
    if (!initial) return false;
    return (
      panNumber !== initial.panNo ||
      (pendingImage.panCard?.uri || panDocument?.uri || '') !== (initial.panDocument?.uri || '')
    );
  };
  const [aadhaarScanMessage, setAadhaarScanMessage] = useState('');
  const [panScanMessage, setPanScanMessage] = useState('');
  const [uploading, setUploading] = useState({ aadhar: false, panCard: false });
  const [pendingImage, setPendingImage] = useState({ aadhar: null, panCard: null });
  const { aadharDocument, panDocument } = driverInfo || {};

  const {setIsApproved} = usePublicDriverStore();

  // Simple delay helper for retry backoff
  const sleep = useCallback(ms => new Promise(resolve => setTimeout(resolve, ms)), []);

  // Determine if an error is retriable (network/timeout/5xx-like)
  const isRetriableError = useCallback(error => {
    const msg = (error?.message || '').toLowerCase();
    if (msg.includes('network request failed') || msg.includes('timeout') || msg.includes('fetch failed') || msg.includes('ecconnaborted')) {
      return true;
    }
    const status = error?.status || error?.response?.status;
    if (typeof status === 'number' && status >= 500) {
      return true;
    }
    return false;
  }, []);

  // Upload wrapper with exponential backoff retry
  const uploadWithRetry = useCallback(
    async (formData, token, maxAttempts = 3) => {
      let attempt = 1;
      let lastError;
      // Cap backoff to 8s max; base ~2s
      const baseDelay = 2000;

      while (attempt <= maxAttempts) {
        try {
          const response = await publicrideDriverApi.updateDriverProof(formData, token);
          if (response?.success) {
            return response;
          }
          // Non-success response: retry unless attempts exhausted
          lastError = new Error(response?.message || 'Upload failed');
        } catch (error) {
          lastError = error;
          if (!isRetriableError(error)) {
            // Non-retriable -> fail immediately
            throw error;
          }
        }

        // If we reached here, we should retry if attempts remain
        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 8000);
          await sleep(delay);
          attempt += 1;
          continue;
        }

        // Exhausted attempts
        throw lastError || new Error('Upload failed');
      }
    },
    [isRetriableError, sleep]
  );

  const switchOptions = useMemo(() => ([
    { id: 'aadhaar', label: t('aadhaar_card', { defaultValue: 'Aadhaar Card' }) },
    { id: 'pan', label: t('pan_card', { defaultValue: 'PAN Card' }) },
  ]), [t]);

  const aadhaarInitialImage = useMemo(() => {
    if (aadhaarDocEntry?.file) {
      return aadhaarDocEntry.file;
    }
    return aadharDocument || null;
  }, [aadhaarDocEntry, aadharDocument]);

  const panInitialImage = useMemo(() => {
    if (panDocEntry?.file) {
      return panDocEntry.file;
    }
    return panDocument || null;
  }, [panDocEntry, panDocument]);

  const extractAadhaarNumber = useCallback(text => {
    if (!text) {
      return '';
    }
    const match = text.replace(/[^0-9\s]/g, ' ').match(aadhaarPattern);
    if (match) {
      return match[0].replace(/\s+/g, '');
    }
    const digits = text.replace(/\D/g, '');
    if (digits.length === 12) {
      return digits;
    }
    return '';
  }, []);

  const extractPanNumber = useCallback(text => {
    if (!text) {
      return '';
    }
    const match = text.toUpperCase().match(panPattern);
    return match ? match[0] : '';
  }, []);

  const uploadProofDocument = useCallback(async (docId, image) => {
    // Only upload if changed
    const changed = docId === 'aadhar' ? isAadhaarChanged() : isPanChanged();
    if (!changed) {
      // showNotification(t('no_changes_to_update', {defaultValue: 'No changes to update.'}), '', 'info');
      goBack();
      return;
    }
    if (!image?.uri) {
      return;
    }

    setUploading(prev => ({ ...prev, [docId]: true }));

    const formData = new FormData();
    formData.append(docId, {
      uri: image.uri,
      name: image.name || `${docId}.jpg`,
      type: image.type || 'image/jpeg',
    });

    const docLabel = docId === 'aadhar'
      ? t('aadhaar_card', { defaultValue: 'Aadhaar Card' })
      : t('pan_card', { defaultValue: 'PAN Card' });
    const driverDocKey = docId === 'aadhar' ? 'aadharDocument' : 'panDocument';

    try {
      const response = await uploadWithRetry(formData, userInfo?.token, 3);
      if (response?.success) {
        setDocumentFile(docId, image);
        updateDocumentStatus(docId, 'uploaded');
        setDriverInfo({ [driverDocKey]: image });
        setPendingImage(prev => ({ ...prev, [docId]: null }));
        setDocumentsCompleteStatus(true)
        setIsApproved(false)
        if (docId === 'aadhar') {
           firebaselog_onBoarding('OB_Driver(OB_D)', 'OB_D:proof_verification_aadhar_completed')
        } else {
           firebaselog_onBoarding('OB_Driver(OB_D)', 'OB_D:proof_verification_pan_completed')
        }
        goBack();
        showNotification(
          docLabel,
          t('document_upload_success', { defaultValue: 'Document updated successfully.' }),
          'success',
        );
      } else {
        throw new Error(response?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error updating driver proof:', error);
      showNotification(
        docLabel,
        error?.message || t('document_upload_failed', { defaultValue: 'Unable to upload document.' }),
        'danger',
      );
    } finally {
      setUploading(prev => ({ ...prev, [docId]: false }));
    }
  }, [setDocumentFile, setDriverInfo, setPendingImage, t, updateDocumentStatus, userInfo?.token, uploadWithRetry, isAadhaarChanged, isPanChanged]);

  const handleAadhaarScan = useCallback(result => {
    if (!result) {
      setAadhaarScanMessage('');
      return;
    }

    const extracted = extractAadhaarNumber(result.text || '');
    if (extracted && aadhaarDigitsPattern.test(extracted)) {
      const formatted = formatAadhaar(extracted);
      setAadhaarNumber(formatted);
      setDriverInfo({ aadharNo: extracted });
      setAadhaarScanMessage(
        t('details_detected_review', {
          defaultValue: 'Details detected automatically. Review before submitting.',
        }),
      );
    } else {
      setAadhaarScanMessage(
        t('details_not_detected_update_manual', {
          defaultValue: 'Could not extract Aadhaar number. Update the field manually.',
        }),
      );
    }
  }, [extractAadhaarNumber, setDriverInfo, t]);

  const handlePanScan = useCallback(result => {
    if (!result) {
      setPanScanMessage('');
      return;
    }

    const extracted = extractPanNumber(result.text || '');
    if (extracted) {
      const formatted = extracted.toUpperCase();
      setPanNumber(formatted);
      setDriverInfo({ panNo: formatted });
      setPanScanMessage(
        t('details_detected_review', {
          defaultValue: 'Details detected automatically. Review before submitting.',
        }),
      );
    } else {
      setPanScanMessage(
        t('details_not_detected_update_manual', {
          defaultValue: 'Could not extract PAN number. Update the field manually.',
        }),
      );
    }
  }, [extractPanNumber, setDriverInfo, t]);

  const renderAadhaarSection = () => (
    <View style={styles.sectionContainer}>
      <DocumentImageScanner
        key="aadhaar-scanner"
        documentLabel={t('aadhaar_card', { defaultValue: 'Aadhaar Card' })}
        browseLabel={t('browse', { defaultValue: 'Browse' })}
        cameraLabel={t('camera', { defaultValue: 'Camera' })}
        onScanComplete={handleAadhaarScan}
        cameraType='back'
        onImageSelected={image => {
          if (image) {
            setPendingImage(prev => ({ ...prev, aadhar: image }));
            setDriverInfo({ aadharDocument: image });
          }
        }}
        helperText={uploading.aadhar
          ? t('document_upload_in_progress', { defaultValue: 'Uploading document. Please wait…' })
          : pendingImage.aadhar
            ? t('document_ready_to_upload', { defaultValue: 'Document ready. Tap Upload to send.' })
            : t('aadhaar_scan_helper', {
                defaultValue: 'Upload or capture the Aadhaar card to detect the number automatically.',
              })}
        scannerTitle={t('upload_aadhaar_card', { defaultValue: 'Upload or capture Aadhaar card' })}
        containerStyle={styles.scannerContainer}
        initialImage={aadhaarInitialImage}
        disabled={uploading.aadhar || isEdit}
        disabledMessage={t('document_upload_in_progress', { defaultValue: 'Uploading document. Please wait…' })}
        disableCamera={isEdit}
        disableBrowse={isEdit}
      />
      <TouchableOpacity
        style={[
          styles.uploadButton,
          (!pendingImage.aadhar || uploading.aadhar || isEdit) && styles.uploadButtonDisabled,
        ]}
        onPress={async () => {
          if (isEdit || !pendingImage.aadhar || uploading.aadhar) {
            if (!pendingImage.aadhar) {
              showNotification(
                t('aadhaar_card', { defaultValue: 'Aadhaar Card' }),
                t('select_document_before_upload', { defaultValue: 'Select or capture the document first.' }),
                'warning',
              );
            }
            return;
          }
          await uploadProofDocument('aadhar', pendingImage.aadhar);
        }}
        disabled={isEdit || !pendingImage.aadhar || uploading.aadhar}
      >
        {uploading.aadhar ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.uploadButtonText}>
            {isAadhaarChanged() ? t('update', {defaultValue: 'Update'}) : t('back', {defaultValue: 'Back'})}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderPanSection = () => (
    <View style={styles.sectionContainer}>
      <DocumentImageScanner
        key="pan-scanner"
        documentLabel={t('pan_card', { defaultValue: 'PAN Card' })}
        browseLabel={t('browse', { defaultValue: 'Browse' })}
        cameraLabel={t('camera', { defaultValue: 'Camera' })}
        onScanComplete={handlePanScan}
        cameraType='back'
        onImageSelected={image => {
          if (image) {
            setPendingImage(prev => ({ ...prev, panCard: image }));
            setDriverInfo({ panDocument: image });
          }
        }}
        helperText={uploading.panCard
          ? t('document_upload_in_progress', { defaultValue: 'Uploading document. Please wait…' })
          : pendingImage.panCard
            ? t('document_ready_to_upload', { defaultValue: 'Document ready. Tap Upload to send.' })
            : t('pan_scan_helper', {
                defaultValue: 'Upload or capture the PAN card to detect the number automatically.',
              })}
        scannerTitle={t('upload_pan_card', { defaultValue: 'Upload or capture PAN card' })}
        containerStyle={styles.scannerContainer}
        initialImage={panInitialImage}
        disabled={uploading.panCard || isEdit}
        disabledMessage={t('document_upload_in_progress', { defaultValue: 'Uploading document. Please wait…' })}
        disableCamera={isEdit}
        disableBrowse={isEdit}
      />
      <TouchableOpacity
        style={[
          styles.uploadButton,
          (!pendingImage.panCard || uploading.panCard || isEdit) && styles.uploadButtonDisabled,
        ]}
        onPress={async () => {
          if (isEdit || !pendingImage.panCard || uploading.panCard) {
            if (!pendingImage.panCard) {
              showNotification(
                t('pan_card', { defaultValue: 'PAN Card' }),
                t('select_document_before_upload', { defaultValue: 'Select or capture the document first.' }),
                'warning',
              );
            }
            return;
          }
          await uploadProofDocument('panCard', pendingImage.panCard);
        }}
        disabled={isEdit || !pendingImage.panCard || uploading.panCard}
      >
        {uploading.panCard ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.uploadButtonText}>
            {t('upload_pan_document', { defaultValue: 'Upload PAN Document' })}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderActiveTab = () => {
    if (activeTab === 'pan') {
      return renderPanSection();
    }
    return renderAadhaarSection();
  };

  return (
    <View style={styles.container}>
      <NavBar
        title={t('proof_documents', { defaultValue: 'Proof Documents' })}
        onBackPress={() => goBack()}
      />
      <UseBackButton onBackPress={() => goBack()} />
      {(uploading.panCard || uploading.aadhaarCard) && <FullScreenLoader />}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.switchContainer}>
          {switchOptions.map(option => {
            const isActive = option.id === activeTab;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.switchButton, isActive ? styles.switchButtonActive : null]}
                onPress={() => setActiveTab(option.id)}
              >
                <Text style={[styles.switchLabel, isActive ? styles.switchLabelActive : null]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.infoText}>
          {t('proof_documents_info', {
            defaultValue: 'Update either Aadhaar or PAN. Provide at least one valid document.',
          })}
        </Text>
        {renderActiveTab()}
      </ScrollView>
    </View>
  );
};

export default DriverProofDoc;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light_grey,
    borderRadius: 16,
    padding: 4,
    marginTop: 16,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  switchButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  switchLabel: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.dark_grey,
  },
  switchLabelActive: {
    fontFamily: Fonts.medium,
    color: Colors.periwinkle,
  },
  sectionContainer: {
    marginTop: 24,
    gap: 12,
  },
  scannerContainer: {
    marginTop: 0,
  },
  textField: {
    marginBottom: 0,
  },
  helperText: {
    fontFamily: Fonts.light,
    fontSize: 12,
    color: Colors.cool_grey,
  },
  infoText: {
    marginTop: 12,
    fontFamily: Fonts.light,
    fontSize: 13,
    color: Colors.dark_grey,
  },
  uploadButton: {
    marginTop: 12,
    backgroundColor: Colors.periwinkle,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.white,
  },
});


