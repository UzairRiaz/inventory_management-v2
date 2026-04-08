import React, { useCallback, useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../api';
import { RecordList, Screen, Section, styles } from '../../../components/ui';

export default function ItemsSetupScreen({ navigation }) {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemTags, setItemTags] = useState('');
  const [manufacturingPrice, setManufacturingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const canManageItems = ['admin', 'manager'].includes(user.role);

  const loadItems = useCallback(async () => {
    try {
      const data = await api.getItems(token);
      setItems(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  const clearForm = () => {
    setEditingItem(null);
    setItemName('');
    setItemTags('');
    setManufacturingPrice('');
    setSellingPrice('');
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setItemName(item.name || '');
    setItemTags(Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''));
    setManufacturingPrice(item.manufacturingPrice != null ? String(item.manufacturingPrice) : '');
    setSellingPrice(item.sellingPrice != null ? String(item.sellingPrice) : '');
  };

  const createItem = async () => {
    try {
      await api.createItem(token, {
        name: itemName,
        tags: itemTags,
        manufacturingPrice: Number(manufacturingPrice || 0),
        sellingPrice: Number(sellingPrice || 0),
      });
      clearForm();
      await loadItems();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const saveEdit = async () => {
    try {
      await api.updateItem(token, editingItem._id, {
        name: itemName,
        tags: itemTags,
        manufacturingPrice: Number(manufacturingPrice || 0),
        sellingPrice: Number(sellingPrice || 0),
      });
      clearForm();
      await loadItems();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  return (
    <Screen>
      <Section title="Item Management" icon="pricetag-outline">
        {canManageItems ? (
          <>
            {editingItem && (
              <Text style={styles.metaText}>Editing: {editingItem.name}</Text>
            )}
            <Text style={styles.fieldLabel}>Item Name</Text>
            <TextInput style={styles.input} value={itemName} onChangeText={setItemName} placeholder="Item name" />
            <Text style={styles.fieldLabel}>Tags</Text>
            <TextInput style={styles.input} value={itemTags} onChangeText={setItemTags} placeholder="Tags (comma separated)" />
            <Text style={styles.fieldLabel}>Manufacturing Price</Text>
            <TextInput style={styles.input} value={manufacturingPrice} onChangeText={setManufacturingPrice} placeholder="Manufacturing price" keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Selling Price</Text>
            <TextInput style={styles.input} value={sellingPrice} onChangeText={setSellingPrice} placeholder="Selling price" keyboardType="numeric" />
            {editingItem ? (
              <View style={{ gap: 8 }}>
                <Button title="Save Changes" onPress={saveEdit} color="#2563eb" />
                <View style={styles.spacer} />
                <Button title="Cancel" onPress={clearForm} color="#6b7280" />
              </View>
            ) : (
              <Button title="Create Item" onPress={createItem} color="#2563eb" />
            )}
            <View style={styles.spacer} />
          </>
        ) : (
          <Text style={styles.metaText}>Only admin/manager can create items.</Text>
        )}
        <RecordList
          title="Items"
          data={items}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'manufacturingPrice', title: 'MFG Price' },
            { key: 'sellingPrice', title: 'Sell Price' },
          ]}
          onRowPress={(item) => {
            if (canManageItems) {
              startEdit(item);
            } else {
              navigation.navigate('RowDetail', { title: 'Item Details', details: item });
            }
          }}
        />
      </Section>
    </Screen>
  );
}
