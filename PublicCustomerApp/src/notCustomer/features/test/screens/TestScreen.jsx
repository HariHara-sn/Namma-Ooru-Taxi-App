import { View, TouchableHighlight, Text } from 'react-native';
import React from 'react';
import RazorpayCheckout from 'react-native-razorpay';
import { createOrder } from '../../../API/EndPoints/EndPoints';

const TestScreen = () => {
  const createOrderAndPay = async () => {
    try {
      const receiptId = '762752582582';
      const response = await createOrder({
        amount: 6,
        currency: 'INR',
        receipt: receiptId,
      });

      const orderId = response?.order?.id;

      if (!orderId) {
        alert('Order creation failed. Please try again.');
        return;
      }

      const options = {
        description: 'Credits towards consultation',
        image: 'https://i.imgur.com/3g7nmJC.jpg',
        currency: 'INR',
        key: 'rzp_live_RjhKqVFU3nP5ZM',
        amount: '600',
        name: 'Acme Corp',
        order_id: orderId, // Replace this with an order_id created using Orders API.
        prefill: {
          email: 'gaurav.kumar@example.com',
          contact: '+919876543210',
          name: 'Gaurav Kumar',
        },
        theme: { color: '#53a20e' },
      };

      RazorpayCheckout.open(options)
        .then((data) => {
          // handle success
          alert(`Success: ${data.razorpay_payment_id}`);
        })
        .catch((error) => {
          // handle failure
          alert(`Error: ${error.code} | ${error.description}`);
        });
    } catch (error) {
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <TouchableHighlight
        onPress={createOrderAndPay}
        style={{
          backgroundColor: '#53a20e',
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
        }}
        underlayColor="#41750c"
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
          Pay Now
        </Text>
      </TouchableHighlight>
    </View>
  );
};

export default TestScreen;
