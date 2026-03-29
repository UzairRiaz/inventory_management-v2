import React, { useEffect, useState } from 'react';
import { Alert, Button, Text, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { NativeSelect, Screen, Section, styles } from '../../components/ui';

export default function LedgerCreateScreen({ navigation }) {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('credit');

  const canEditLedger = ['admin', 'manager'].includes(user.role);

  const loadItems = async () => {
    try {
      const itemData = await api.getItems(token);
      setItems(itemData);
      if (!itemId && itemData[0]?._id) setItemId(itemData[0]._id);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const createEntry = async () => {
    try {
      if (!canEditLedger) {
        Alert.alert('Access denied', 'You do not have permission to create ledger entries');
        return;
      }

      const payload = { description, type };
      if (amount !== '') payload.amount = Number(amount || 0);
      if (itemId) {
        payload.itemId = itemId;
        payload.quantity = Number(quantity || 1);
        if (unitPrice !== '') payload.unitPrice = Number(unitPrice || 0);
      }

      await api.createLedger(token, payload);
      Alert.alert('Success', 'Ledger entry created');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <Screen>
      <Section title="New Ledger Entry" icon="add-circle-outline">
        <Text style={styles.metaText}>Entry Type</Text>
        <NativeSelect
          value={type}
          onChange={setType}
          placeholder="Select entry type"
          items={[
            { label: 'Credit', value: 'credit' },
            { label: 'Debit', value: 'debit' },
          ]}
        />

        <Text style={styles.metaText}>Item (optional for quick entry)</Text>
        <NativeSelect
          value={itemId}
          onChange={setItemId}
          placeholder="No item"
          items={[
            { label: 'No item', value: '' },
            ...items.map((item) => ({ label: `${item.name} (Sell ${item.sellingPrice})`, value: item._id })),
          ]}
        />

        {itemId ? (
          <>
            <Text style={styles.fieldLabel}>Quantity</Text>
            <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="Quantity" keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Unit Price</Text>
            <TextInput
              style={styles.input}
              value={unitPrice}
              onChangeText={setUnitPrice}
              placeholder="Unit price (optional, auto from item if blank)"
              keyboardType="numeric"
            />
          </>
        ) : null}

        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Description" />

        <Text style={styles.fieldLabel}>Amount</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="Amount (optional when item selected)" keyboardType="numeric" />

        <Button title="Create Ledger Entry" onPress={createEntry} color="#16a34a" />
      </Section>
    </Screen>
  );
}
