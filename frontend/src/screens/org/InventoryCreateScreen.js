import React, { useEffect, useState } from 'react';
import { Alert, Button, Text, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { NativeSelect, Screen, Section, styles } from '../../components/ui';

export default function InventoryCreateScreen({ navigation }) {
  const { token, user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [adjustType, setAdjustType] = useState('IN');

  const loadOptions = async () => {
    try {
      const [warehouseData, itemData] = await Promise.all([api.getWarehouses(token), api.getItems(token)]);
      setWarehouses(warehouseData);
      setItems(itemData);
      if (!warehouseId && warehouseData[0]?._id) setWarehouseId(warehouseData[0]._id);
      if (!itemId && itemData[0]?._id) setItemId(itemData[0]._id);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const onSubmit = async () => {
    try {
      if (!warehouseId || !itemId) {
        Alert.alert('Validation', 'Please select warehouse and item');
        return;
      }

      if (user.role === 'staff') {
        await api.createNote(token, {
          type: 'debit',
          customerName: 'INTERNAL',
          amount: 0,
          description: `Adjustment request by ${user.name}: ${adjustType} ${quantity} for item ${itemId} in warehouse ${warehouseId}`,
          linkedTransactionId: `stock-request-${Date.now()}`,
        });
        Alert.alert('Requested', 'Stock adjustment request submitted as note for admin review.');
        navigation.goBack();
        return;
      }

      await api.adjustStock(token, {
        warehouseId,
        itemId,
        quantity: Number(quantity || 0),
        type: adjustType,
      });

      Alert.alert('Success', 'Inventory updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  return (
    <Screen>
      <Section title={user.role === 'staff' ? 'Request Inventory Adjustment' : 'Adjust Inventory'} icon="add-circle-outline">
        <Text style={styles.metaText}>Warehouse</Text>
        <NativeSelect
          value={warehouseId}
          onChange={setWarehouseId}
          placeholder="Select warehouse"
          items={warehouses.map((warehouse) => ({ label: warehouse.name, value: warehouse._id }))}
        />

        <Text style={styles.metaText}>Item</Text>
        <NativeSelect
          value={itemId}
          onChange={setItemId}
          placeholder="Select item"
          items={items.map((item) => ({ label: item.name, value: item._id }))}
        />

        <Text style={styles.fieldLabel}>Quantity</Text>
        <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="Quantity" keyboardType="numeric" />

        <Text style={styles.fieldLabel}>Adjustment Type</Text>
        <TextInput style={styles.input} value={adjustType} onChangeText={setAdjustType} placeholder="IN or OUT" autoCapitalize="characters" />

        <Button title={user.role === 'staff' ? 'Request Adjustment' : 'Adjust Stock'} onPress={onSubmit} color="#7c3aed" />
      </Section>
    </Screen>
  );
}
