import React, { useEffect, useState } from 'react';
import { Alert, Button, Text, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { NativeSelect, Screen, Section, styles } from '../../components/ui';

export default function PaymentsCreateScreen({ navigation }) {
  const { token } = useAuth();
  const [outstanding, setOutstanding] = useState([]);
  const [saleId, setSaleId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMode, setPaymentMode] = useState('sale');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const loadOutstanding = async () => {
    try {
      const [outstandingData, customerData] = await Promise.all([
        api.getOutstandingCreditSales(token),
        api.getCustomers(token),
      ]);
      setOutstanding(outstandingData);
      setCustomers(customerData || []);
      if (!saleId && outstandingData[0]?._id) setSaleId(outstandingData[0]._id);
      if (!customerId && customerData[0]?._id) setCustomerId(customerData[0]._id);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const receivePayment = async () => {
    try {
      const amount = Number(paymentAmount || 0);
      if (!amount || amount <= 0) {
        Alert.alert('Validation', 'Enter a valid payment amount');
        return;
      }

      if (paymentMode === 'sale') {
        if (!saleId) {
          Alert.alert('Validation', 'Select a credit sale first');
          return;
        }

        await api.receiveSalePayment(token, saleId, {
          amount,
          note: paymentNote,
        });
      } else {
        if (!customerId) {
          Alert.alert('Validation', 'Select a customer first');
          return;
        }

        await api.receiveCustomerPayment(token, customerId, {
          amount,
          note: paymentNote,
        });
      }

      Alert.alert('Success', 'Payment received successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    loadOutstanding();
  }, []);

  return (
    <Screen>
      <Section title="Receive Payment" icon="add-circle-outline">
        <Text style={styles.metaText}>Payment Type</Text>
        <NativeSelect
          value={paymentMode}
          onChange={setPaymentMode}
          placeholder="Select payment type"
          items={[
            { label: 'Credit Sale Payment', value: 'sale' },
            { label: 'Customer Opening Outstanding', value: 'customer' },
          ]}
        />

        {paymentMode === 'sale' ? (
          <>
            <Text style={styles.metaText}>Credit Sale</Text>
            <NativeSelect
              value={saleId}
              onChange={setSaleId}
              placeholder="Select credit sale"
              items={outstanding.map((sale) => ({
                label: `${sale.customerName} | Remaining ${sale.remainingAmount}`,
                value: sale._id,
              }))}
            />
          </>
        ) : (
          <>
            <Text style={styles.metaText}>Customer</Text>
            <NativeSelect
              value={customerId}
              onChange={setCustomerId}
              placeholder="Select customer"
              items={customers.map((customer) => ({
                label: `${customer.name} | Opening ${customer.openingBalance || 0}`,
                value: customer._id,
              }))}
            />
          </>
        )}

        <Text style={styles.fieldLabel}>Incoming Payment Amount</Text>
        <TextInput
          style={styles.input}
          value={paymentAmount}
          onChangeText={setPaymentAmount}
          placeholder="Incoming payment amount"
          keyboardType="numeric"
        />

        <Text style={styles.fieldLabel}>Payment Note</Text>
        <TextInput style={styles.input} value={paymentNote} onChangeText={setPaymentNote} placeholder="Payment note" />

        <Button title="Receive Payment" onPress={receivePayment} color="#16a34a" />
      </Section>
    </Screen>
  );
}
