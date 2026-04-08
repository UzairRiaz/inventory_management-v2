import React, { useCallback, useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../api';
import { RecordList, Screen, Section, styles } from '../../../components/ui';

export default function CustomersSetupScreen({ navigation }) {
  const { token, user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  const canManageCustomers = ['admin', 'manager'].includes(user.role);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await api.getCustomers(token);
      setCustomers(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  const clearForm = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setOpeningBalance('');
  };

  const startEdit = (customer) => {
    setEditingCustomer(customer);
    setName(customer.name || '');
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setAddress(customer.address || '');
    setOpeningBalance('');
  };

  const createCustomer = async () => {
    try {
      if (!name) {
        Alert.alert('Validation', 'Customer name is required');
        return;
      }

      await api.createCustomer(token, { name, phone, email, address, openingBalance: Number(openingBalance || 0) });
      clearForm();
      await loadCustomers();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const saveEdit = async () => {
    try {
      if (!name) {
        Alert.alert('Validation', 'Customer name is required');
        return;
      }
      await api.updateCustomer(token, editingCustomer._id, { name, phone, email, address });
      clearForm();
      await loadCustomers();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers]),
  );

  return (
    <Screen>
      <Section title="Customers" icon="person-outline">
        {canManageCustomers ? (
          <>
            {editingCustomer && (
              <Text style={styles.metaText}>Editing: {editingCustomer.name}</Text>
            )}
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Customer name" />
            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" />
            {!editingCustomer && (
              <>
                <Text style={styles.fieldLabel}>Initial Outstanding</Text>
                <TextInput
                  style={styles.input}
                  value={openingBalance}
                  onChangeText={setOpeningBalance}
                  placeholder="Opening balance"
                  keyboardType="numeric"
                />
              </>
            )}
            {editingCustomer ? (
              <View style={{ gap: 8 }}>
                <Button title="Save Changes" onPress={saveEdit} color="#1d4ed8" />
                <View style={styles.spacer} />
                <Button title="Cancel" onPress={clearForm} color="#6b7280" />
              </View>
            ) : (
              <Button title="Create Customer" onPress={createCustomer} color="#1d4ed8" />
            )}
            <View style={styles.spacer} />
          </>
        ) : (
          <Text style={styles.metaText}>Only admin/manager can create customers.</Text>
        )}

        <RecordList
          title="Customer List"
          data={customers}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'phone', title: 'Phone' },
            { key: 'email', title: 'Email' },
            { key: 'openingBalance', title: 'Outstanding' },
          ]}
          onRowPress={(item) => {
            if (canManageCustomers) {
              startEdit(item);
            } else {
              navigation.navigate('RowDetail', { title: 'Customer Details', details: item });
            }
          }}
        />
      </Section>
    </Screen>
  );
}
