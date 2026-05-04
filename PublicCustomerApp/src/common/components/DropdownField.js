import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors, Fonts } from '../constants/constants';

const DropdownField = ({ label, value, options, onSelect, placeholder, isMulti = false }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const getDisplayText = () => {
    if (isMulti) {
      if (!value || value.length === 0) return placeholder;
      const labels = options.filter(opt => value.includes(opt.value)).map(opt => opt.label);
      return labels.join(', ');
    } else {
      if (!value) return placeholder;
      const opt = options.find(o => o.value === value);
      return opt ? opt.label : placeholder;
    }
  };

  const handleSelect = (itemValue) => {
    if (isMulti) {
      const current = value || [];
      if (current.includes(itemValue)) {
        onSelect(current.filter(v => v !== itemValue));
      } else {
        onSelect([...current, itemValue]);
      }
    } else {
      onSelect(itemValue);
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={styles.dropdownButton} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {getDisplayText()}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.grey_dark} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => {
                const isSelected = isMulti 
                  ? (value || []).includes(item.value)
                  : value === item.value;
                  
                return (
                  <TouchableOpacity 
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={Colors.periwinkle || '#4A90E2'} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            {isMulti && (
              <TouchableOpacity 
                style={styles.doneButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.black,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
  },
  dropdownText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.black,
  },
  placeholderText: {
    color: '#9e9e9e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 16,
    color: Colors.black,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  optionText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.black,
  },
  optionTextSelected: {
    fontFamily: Fonts.medium,
    color: Colors.periwinkle || '#4A90E2',
  },
  doneButton: {
    margin: 16,
    backgroundColor: Colors.periwinkle || '#4A90E2',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: Fonts.semi_bold,
    color: Colors.white,
    fontSize: 16,
  }
});

export default DropdownField;



