import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import PropTypes from 'prop-types';

const CancelRideModal = ({
  callCancelRide,
  modalVisible,
  setModalVisible,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const reasons = [
    'Waiting for too long', 
    'Unable to contact driver', 
    'Driver denied come to pickup', 
    'Driver asked to cancel', 
    'Driver asking for more money',
    'Price is not reasonable',
    'Other'
  ];

  const handleReasonSelect = (reason) => {
    setSelectedReason(reason);
  };

  const handleCancel = () => {
    const reason = selectedReason === 'Other' ? otherReason : selectedReason;
    callCancelRide(reason);
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalView}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cancel Ride</Text>
                <Text style={styles.modalHeaderText}>Please select a reason for cancelling the Trip :</Text>

                <View style={styles.modalBody}> 
            {reasons.map((reason, index) => (
              <View key={index} style={styles.reasonContainer}>
                <CheckBox
                  value={selectedReason === reason}
                  onValueChange={() => handleReasonSelect(reason)}
                 
                />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}

          {selectedReason === 'Other' && (
            <TextInput
              style={styles.textInput}
              placeholder="Enter your reason"
              value={otherReason}
              onChangeText={setOtherReason}
            />
          )}
          </View>
            </View>
          
          

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                { backgroundColor: selectedReason ? '#FF0000' : '#ccc' }
              ]}
              onPress={handleCancel}
              disabled={!selectedReason}
            >
              <Text style={styles.modalButtonText}>Cancel Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonClose]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CancelRideModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBody: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#fff',
    alignItems: 'flex-start',
  },
  modalHeader: {
    marginTop: 20,
    width: '100%',
    color: 'black',
    padding: 20,
    alignItems: 'flex-start',
  },
  
  modalHeaderText: {
    fontSize: 16,
    color: 'gray',
    
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  modalTitle: {
    fontSize: 24,
    color: 'black',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalFooter: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButtonClose: {
    backgroundColor: '#6c757d',
  },
  cancelButton: {
    marginTop: 20,
  },
  selectedButton: {
    backgroundColor: '#0056b3',
  },
  textInput: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
});

CancelRideModal.propTypes = {
  callCancelRide: PropTypes.func.isRequired,
  modalVisible: PropTypes.bool.isRequired,
  setModalVisible: PropTypes.func.isRequired,
};
