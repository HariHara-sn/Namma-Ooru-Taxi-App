import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PropTypes from 'prop-types';
import { Fonts } from '../../../constants/constants';
import TripSelectionScreen from '../screens/TripSelectionScreen';
import { getTicketCategories } from '../../../API/EndPoints/EndPoints';
import { useTranslation } from 'react-i18next';

const CreateTicketForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium',
    ticketType: 'app', // 'trip' or 'app'
    selectedTrip: null,
  });
  const [showTripSelection, setShowTripSelection] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [errors, setErrors] = useState({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [userEditedDescription, setUserEditedDescription] = useState(false);
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const scrollViewRef = useRef(null);
  const { t } = useTranslation();

  // Animation values
  const tripSelectionOpacity = useRef(new Animated.Value(0)).current;
  const tripSelectionHeight = useRef(new Animated.Value(0)).current;
  const tripDetailsOpacity = useRef(new Animated.Value(0)).current;
  const tripDetailsHeight = useRef(new Animated.Value(0)).current;

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await getTicketCategories();
        if (response.success && response.categories) {
          setCategories(response.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to default categories if API fails
        setCategories([
          { 
            _id: '688f955e6916c287b05d6f32', 
            name: 'Trip Fare Issues', 
            description: 'Issues related to trip pricing, billing, and payment',
            ticketType: 'TRIP' 
          },
          { 
            _id: '688f955e6916c287b05d6f38', 
            name: 'Driver App Issues', 
            description: 'Technical problems with the driver mobile application',
            ticketType: 'APP' 
          },
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  console.log('categories', categories);

  // Filter categories based on ticket type
  const filteredCategories = categories.filter(category => {
    if (formData.ticketType === 'trip') {
      return category.ticketType === 'TRIP';
    } else {
      return category.ticketType === 'APP';
    }
  });

  // Reset form data when ticket type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subject: '',
      description: '',
      category: '',
      selectedTrip: null,
    }));
    setErrors({});
  }, [formData.ticketType]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Animate trip selection when ticket type changes
  useEffect(() => {
    if (formData.ticketType === 'trip') {
      Animated.parallel([
        Animated.timing(tripSelectionOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(tripSelectionHeight, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(tripSelectionOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(tripSelectionHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [formData.ticketType, tripSelectionHeight, tripSelectionOpacity]);

  // Animate trip details when trip is selected
  useEffect(() => {
    if (formData.selectedTrip) {
      Animated.parallel([
        Animated.timing(tripDetailsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(tripDetailsHeight, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(tripDetailsOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(tripDetailsHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [formData.selectedTrip, tripDetailsHeight, tripDetailsOpacity]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'subject_required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'description_required';
    }

    if (!formData.category) {
      newErrors.category = 'category_required';
    }

    if (formData.ticketType === 'trip' && !formData.selectedTrip) {
      newErrors.selectedTrip = 'select_trip_required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'open',
        ticketId: `TKT${Date.now()}`,
      });
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCategorySelect = (categoryId) => {
    const selectedCategory = categories.find(cat => cat._id === categoryId);

    updateFormData('category', categoryId);

    if (!userEditedDescription) {
      updateFormData('description', '');
      if (selectedCategory && selectedCategory.description) {
        setTimeout(() => {
          updateFormData('description', translateCategoryDescription(selectedCategory.name));
        }, 100);
      }
    }

    if (selectedCategory?.name) {
      setTimeout(() => {
        updateFormData('subject', translateCategoryName(selectedCategory.name));
      }, 0);
    }
  };

  const translateCategoryName = (name) => {
    if (name) {
      const keys = name.replaceAll(' ', '_').toLowerCase();
      return t('support_categories_' + keys + '_name');
    }
    return name;
  };

  const translateCategoryDescription = (description) => {
    if (description) {
      const keys = description.replaceAll(' ', '_').toLowerCase();
      return t('support_categories_' + keys + '_description');
    }
    return description;
  };

  // Default select first category when categories are loaded or ticket type changes
  useEffect(() => {
    if (loadingCategories) return;
    if (formData.category) return;

    const firstCategory = filteredCategories[0];
    if (firstCategory) {
      updateFormData('category', firstCategory._id);
      if (!userEditedDescription) {
        updateFormData('description', '');
      }
      const selectedCategory = categories.find(cat => cat._id === firstCategory._id);
      if (selectedCategory) {
        setTimeout(() => {
          if (!userEditedDescription && selectedCategory.description) {
            updateFormData('description', translateCategoryDescription(selectedCategory.name));
          }
          if (selectedCategory.name) {
            updateFormData('subject', translateCategoryName(selectedCategory.name));
          }
        }, 100);
      }
    }
  }, [
    loadingCategories,
    filteredCategories,
    formData.category,
    categories,
    userEditedDescription,
  ]);

  const formatTripDisplay = (trip) => {
    const date = new Date(trip.bookingTime);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const MAX_ADDRESS_LENGTH = 32;
    const ellipsize = (str, max) => {
      if (!str) return '';
      return str.length > max ? str.slice(0, max - 3) + '...' : str;
    };

    const startAddressRaw = trip.stops?.[0]?.address || 'Unknown location';
    const endAddressRaw = trip.stops?.[trip.stops.length - 1]?.address || 'Unknown location';

    const startAddress = ellipsize(startAddressRaw, MAX_ADDRESS_LENGTH);
    const endAddress = ellipsize(endAddressRaw, MAX_ADDRESS_LENGTH);

    return `${startAddress} → ${endAddress} (${formattedDate})`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${month}/${day}/${year} - ${displayHours}:${minutes} ${ampm}`;
  };

  return (
    /**
     * IMPORTANT (Android):
     * Make sure your Activity has:
     * android:windowSoftInputMode="adjustResize"
     * in AndroidManifest, so KeyboardAvoidingView can work correctly.
     */
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding" // use padding for BOTH platforms so the bottom bar moves up
      keyboardVerticalOffset={0}
    >
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onCancel}
          >
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('support_create_form_title')}</Text>
        </View>
        <Text style={styles.subtitle}>{t('support_create_form_subtitle')}</Text>
      </View>

      {/* Scrollable Form Content */}
      <ScrollView
        style={styles.scrollableContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContentContainer,
          keyboardVisible && styles.scrollContentContainerKeyboard,
        ]}
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
      >
        <View style={styles.form}>
          {/* Ticket Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('support_create_form_ticket_type')} *</Text>
            <View style={styles.ticketTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.ticketTypeButton,
                  formData.ticketType === 'app' && styles.ticketTypeButtonActive,
                ]}
                onPress={() => updateFormData('ticketType', 'app')}
              >
                <Ionicons
                  name="phone-portrait"
                  size={16}
                  color={formData.ticketType === 'app' ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.ticketTypeButtonText,
                    formData.ticketType === 'app' && styles.ticketTypeButtonTextActive,
                  ]}
                >
                  {t('support_create_form_app_related')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ticketTypeButton,
                  formData.ticketType === 'trip' && styles.ticketTypeButtonActive,
                ]}
                onPress={() => updateFormData('ticketType', 'trip')}
              >
                <Ionicons
                  name="car"
                  size={16}
                  color={formData.ticketType === 'trip' ? '#FFFFFF' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.ticketTypeButtonText,
                    formData.ticketType === 'trip' && styles.ticketTypeButtonTextActive,
                  ]}
                >
                  {t('support_create_form_trip_related')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Trip Selection Dropdown - Only when ticket type is trip */}
          <Animated.View
            style={[
              styles.inputGroup,
              {
                opacity: tripSelectionOpacity,
                maxHeight: tripSelectionHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 300],
                }),
                overflow: 'hidden',
              },
            ]}
          >
            <Text style={styles.label}>{t('support_create_form_select_trip_label')} *</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, errors.selectedTrip && styles.inputError]}
              onPress={() => {
                setShowTripSelection(true);
              }}
            >
              <Text
                style={[
                  styles.dropdownButtonText,
                  !formData.selectedTrip && styles.placeholderText,
                ]}
              >
                {formData.selectedTrip
                  ? formatTripDisplay(formData.selectedTrip)
                  : t('support_create_form_select_trip_placeholder')}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
            {errors.selectedTrip && (
              <Text style={styles.errorText}>
                {t('support_create_form_error_select_trip')}
              </Text>
            )}

            {/* Selected trip details */}
            <Animated.View
              style={[
                styles.tripDetailsContainer,
                {
                  opacity: tripDetailsOpacity,
                  maxHeight: tripDetailsHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 200],
                  }),
                  overflow: 'hidden',
                },
              ]}
            >
              <Text style={styles.tripDetailsTitle}>
                {t('support_create_form_trip_details')}:
              </Text>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>
                  {t('support_create_form_from')}:
                </Text>
                <Text style={styles.tripDetailValue}>
                  {formData.selectedTrip?.stops?.[0]?.address || 'Unknown location'}
                </Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>
                  {t('support_create_form_to')}:
                </Text>
                <Text style={styles.tripDetailValue}>
                  {formData.selectedTrip?.stops?.[formData.selectedTrip?.stops?.length - 1]?.address ||
                    'Unknown location'}
                </Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>
                  {t('support_create_form_date')}:
                </Text>
                <Text style={styles.tripDetailValue}>
                  {formData.selectedTrip ? formatDate(formData.selectedTrip.bookingTime) : ''}
                </Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>
                  {t('support_create_form_fare')}:
                </Text>
                <Text style={styles.tripDetailValue}>
                  ₹{formData.selectedTrip?.estimatedFare ||
                    formData.selectedTrip?.minFare ||
                    0}
                </Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>
                  {t('support_create_form_distance')}:
                </Text>
                <Text style={styles.tripDetailValue}>
                  {formData.selectedTrip?.estimatedDistance || 0} km
                </Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>
                  {t('support_create_form_driver')}:
                </Text>
                <Text style={styles.tripDetailValue}>
                  {formData.selectedTrip?.driverInfo?.driverName || 'No driver assigned'}
                </Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>
                  {t('support_create_form_status')}:
                </Text>
                <Text style={styles.tripDetailValue}>
                  {formData.selectedTrip?.status || 'Unknown'}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('support_create_form_category_label')} *</Text>
            {loadingCategories ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  {t('support_create_form_loading_categories')}
                </Text>
              </View>
            ) : filteredCategories.length > 0 ? (
              <View style={styles.categoryContainer}>
                {filteredCategories.map(category => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.categoryButton,
                      formData.category === category._id && styles.categoryButtonActive,
                    ]}
                    onPress={() => handleCategorySelect(category._id)}
                  >
                    <View style={styles.categoryContent}>
                      <Text
                        style={[
                          styles.categoryButtonText,
                          formData.category === category._id &&
                            styles.categoryButtonTextActive,
                        ]}
                      >
                        {translateCategoryName(category.name)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noCategoriesContainer}>
                <Text style={styles.noCategoriesText}>
                  {t('support_create_form_no_categories')}
                </Text>
              </View>
            )}
            {errors.category && (
              <Text style={styles.errorText}>
                {t('support_create_form_error_category_required')}
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('support_create_form_description_label')} *</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              placeholder={t('support_create_form_description_placeholder')}
              value={formData.description}
              onFocus={() => {
                setDescriptionFocused(true);
              }}
              onBlur={() => setDescriptionFocused(false)}
              onChangeText={text => {
                if (!userEditedDescription) setUserEditedDescription(true);
                updateFormData('description', text);
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>
                {t('support_create_form_error_description_required')}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Buttons (moves up with keyboard now) */}
      <View style={styles.fixedBottom}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="send" size={16} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>{t('create_ticket')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Trip Selection Modal */}
      {showTripSelection && (
        <View style={styles.modalOverlay}>
          <TripSelectionScreen
            onTripSelect={trip => {
              updateFormData('selectedTrip', trip);
              setShowTripSelection(false);
            }}
            onCancel={() => setShowTripSelection(false)}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#6B7280',
  },
  scrollableContent: {
    flex: 1,
    marginTop: 120, // Space for fixed header
  },
  scrollContentContainer: {
    paddingBottom: 120, // Space for fixed bottom buttons
  },
  scrollContentContainerKeyboard: {
    paddingBottom: 200, // Extra space when keyboard is open
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.semi_bold,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#1F2937',
    minHeight: 120,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  ticketTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  ticketTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  ticketTypeButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  ticketTypeButtonText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: '#6B7280',
  },
  ticketTypeButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.medium,
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#1F2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  tripDetailsContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  tripDetailsTitle: {
    fontSize: 14,
    fontFamily: Fonts.semi_bold,
    color: '#374151',
    marginBottom: 8,
  },
  tripDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tripDetailLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#6B7280',
    width: 60,
  },
  tripDetailValue: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#1F2937',
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  categoryButtonText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.medium,
  },
  categoryContent: {
    flex: 1,
  },
  categoryDescription: {
    fontSize: 10,
    fontFamily: Fonts.regular,
    color: '#9CA3AF',
    marginTop: 2,
  },
  categoryDescriptionActive: {
    color: '#E5E7EB',
  },
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    zIndex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semi_bold,
    color: '#6B7280',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semi_bold,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#6B7280',
  },
  noCategoriesContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCategoriesText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#6B7280',
  },
});

CreateTicketForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default CreateTicketForm;
