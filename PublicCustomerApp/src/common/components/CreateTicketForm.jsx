import React, { useState, useEffect, useRef, useContext } from 'react';
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
import useUserStore from '../store/useUserStore';
import APIRequest from '../APIRequest';
import UseBackButton from '../hooks/UseBackButton';
import TripSelectionScreen from '../screens/RiseSupportTicket/TripSelectionScreen';
import { Fonts } from '../constants/constants';
import { useTranslation } from 'react-i18next';



const CreateTicketForm = ({ onSubmit, onCancel }) => {
  const {t} = useTranslation()
  const {userInfo} = useUserStore();
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
  
  // Animation values
  const tripSelectionOpacity = useRef(new Animated.Value(0)).current;
  const tripSelectionHeight = useRef(new Animated.Value(0)).current;
  const tripDetailsOpacity = useRef(new Animated.Value(0)).current;
  const tripDetailsHeight = useRef(new Animated.Value(0)).current;

  console.log('formData',userInfo?.token);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const api = new APIRequest()
        const response = await api.request('/publicrides/driver/v2/getTicketCategories', 'GET', {}, userInfo?.token);
        if (response.success && response.categories) {
          setCategories(response.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

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
    // Reset all form fields when ticket type changes
    setFormData(prev => ({
      ...prev,
      subject: '',
      description: '',
      category: '',
      selectedTrip: null,
    }));
    
    // Clear any errors
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
      // Animate in
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
      // Animate out
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
  }, [formData.ticketType]);

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
  }, [formData.selectedTrip]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Validate trip selection if ticket type is trip
    if (formData.ticketType === 'trip' && !formData.selectedTrip) {
      newErrors.selectedTrip = 'Please select a trip';
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
    // Find the selected category
    const selectedCategory = categories.find(cat => cat._id === categoryId);
    console.log('Selected category:', selectedCategory);
    
    // Update category
    updateFormData('category', categoryId);
    
    // Auto-populate description only if text field is empty
    if (selectedCategory && selectedCategory.description) {
      const isDescriptionEmpty = !formData.description || !formData.description.trim();
      
      if (isDescriptionEmpty) {
        console.log('Setting description:', selectedCategory.description);
        updateFormData('description', selectedCategory.description);
      } else {
        console.log('Description field already has content, skipping auto-populate');
      }
      
      // Always update subject
      updateFormData('subject', selectedCategory.name);
    } else {
      console.log('No description found for category');
    }
  };

  const formatTripDisplay = (trip) => {
    const date = new Date(trip.bookingTime);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${month}/${day}/${year} - ${displayHours}:${minutes} ${ampm}`;
  };

     return (
      <View style={styles.container}>
     <KeyboardAvoidingView 
       style={styles.container2}
       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : keyboardVisible ? 100 : 0}
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
           <Text style={styles.title}>{t('create_new_ticket')}</Text>
         </View>
         <Text style={styles.subtitle}>{t('describe_your_issue_and_we_ll_help_you_resolve_it')}</Text>
       </View>
      <UseBackButton onBackPress={onCancel} />
      {/* Scrollable Form Content */}
      <ScrollView 
        style={styles.scrollableContent} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContentContainer,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Ticket Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('ticket_type')} *</Text>
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
                  {t('app_related')}
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
                  {t('trip_related')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Trip Selection Dropdown - Only show when ticket type is trip */}
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
              }
            ]}
          >
            <Text style={styles.label}>{t('select_trip')} *</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, errors.selectedTrip && styles.inputError]}
              onPress={() => {
                // Show trip selection screen as overlay
                setShowTripSelection(true);
              }}
            >
              <Text style={[
                styles.dropdownButtonText,
                !formData.selectedTrip && styles.placeholderText
              ]}>
                {formData.selectedTrip 
                  ? formatTripDisplay(formData.selectedTrip)
                  : t.select_a_trip_from_your_ride_history
                }
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
            {errors.selectedTrip && <Text style={styles.errorText}>{errors.selectedTrip}</Text>}
            
            {/* Show selected trip details with animation */}
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
                }
              ]}
            >
              <Text style={styles.tripDetailsTitle}>{t('trip_details')}:</Text>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>{t('from')}:</Text>
                <Text style={styles.tripDetailValue}>{formData.selectedTrip?.stops?.[0]?.address || 'Unknown location'}</Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>{t('to')}:</Text>
                <Text style={styles.tripDetailValue}>{formData.selectedTrip?.stops?.[formData.selectedTrip?.stops?.length - 1]?.address || 'Unknown location'}</Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>{t('date')}:</Text>
                <Text style={styles.tripDetailValue}>{formData.selectedTrip ? formatDate(formData.selectedTrip.bookingTime) : ''}</Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>{t('fare')}:</Text>
                <Text style={styles.tripDetailValue}>₹{formData.selectedTrip?.estimatedFare || formData.selectedTrip?.minFare || 0}</Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>{t('distance')}:</Text>
                <Text style={styles.tripDetailValue}>{formData.selectedTrip?.estimatedDistance || 0} km</Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>{t('driver')}:</Text>
                <Text style={styles.tripDetailValue}>{formData.selectedTrip?.driverInfo?.driverName || 'No driver assigned'}</Text>
              </View>
              <View style={styles.tripDetailRow}>
                <Text style={styles.tripDetailLabel}>{t('status')}:</Text>
                <Text style={styles.tripDetailValue}>{formData.selectedTrip?.status || 'Unknown'}</Text>
              </View>
            </Animated.View>
          </Animated.View>

         

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('category')} *</Text>
            {loadingCategories ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('loading_categories')}</Text>
              </View>
            ) : filteredCategories.length > 0 ? (
              <View style={styles.categoryContainer}>
                {filteredCategories.map((category) => (
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
                          formData.category === category._id && styles.categoryButtonTextActive,
                        ]}
                      >
                        {category.name}
                      </Text>
                     
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noCategoriesContainer}>
                <Text style={styles.noCategoriesText}>{t('no_categories_available_for_this_ticket_type')}</Text>
              </View>
            )}
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Priority */}
          {/* {showPriority && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.id}
                    style={[
                      styles.priorityButton,
                      formData.priority === priority.id && styles.priorityButtonActive,
                      { borderColor: priority.color },
                    ]}
                    onPress={() => updateFormData('priority', priority.id)}
                  >
                    <View
                      style={[
                        styles.priorityIndicator,
                        { backgroundColor: priority.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityButtonText,
                        formData.priority === priority.id && styles.priorityButtonTextActive,
                      ]}
                    >
                      {priority.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )} */}

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('description')} *</Text>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              placeholder={t('please_provide_detailed_information_about_your_issue')}
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            </KeyboardAvoidingView>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>
        </View>
      </ScrollView>

      

      {/* Trip Selection Modal */}
      {showTripSelection && (
        <View style={styles.modalOverlay}>
          <TripSelectionScreen
            onTripSelect={(trip) => {
              updateFormData('selectedTrip', trip);
              setShowTripSelection(false);
            }}
            onCancel={() => setShowTripSelection(false)}
          />
        </View>
      )}
    </KeyboardAvoidingView>
    {/* Fixed Bottom Action Buttons */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container2:{
    flex: 1,
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
    paddingBottom: 200, // Adjust for keyboard
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
    // minHeight: 120,
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
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priorityButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  priorityButtonText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#6B7280',
  },
  priorityButtonTextActive: {
    color: '#92400E',
    fontFamily: Fonts.medium,
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
  noTripsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  noTripsText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#374151',
    marginTop: 10,
  },
  noTripsSubtext: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: '#6B7280',
    marginTop: 4,
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

export default CreateTicketForm; 