import React, { useEffect, useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { NativeSelect, Screen, Section, styles } from '../../components/ui';

export default function SalesCreateScreen({ navigation }) {
  const { token, user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [stock, setStock] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitSellingPrice, setUnitSellingPrice] = useState('');
  const [saleItems, setSaleItems] = useState([]);
  const [paymentType, setPaymentType] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');

  const canCreateSales = ['admin', 'manager', 'staff'].includes(user.role);

  const loadOptions = async () => {
    try {
      const [warehouseData, itemData, stockData, customerData] = await Promise.all([
        api.getWarehouses(token),
        api.getItems(token),
        api.getStock(token),
        api.getCustomers(token),
      ]);
      setWarehouses(warehouseData);
      setItems(itemData);
      setStock(stockData);
      setCustomers(customerData);
      if (!warehouseId && warehouseData[0]?._id) setWarehouseId(warehouseData[0]._id);
      if (!itemId && itemData[0]?._id) setItemId(itemData[0]._id);
      if (!customerId && customerData[0]?._id) setCustomerId(customerData[0]._id);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const createSale = async () => {
    try {
      if (!canCreateSales) {
        Alert.alert('Access denied', 'You do not have permission to create sales');
        return;
      }

      if (saleItems.length === 0) {
        Alert.alert('Validation', 'Add at least one item to the sale');
        return;
      }

      if (!customerId && !customerName) {
        Alert.alert('Validation', 'Select a customer or enter a customer name');
        return;
      }

      const payload = {
        customerId: customerId || undefined,
        customerName: customerName || undefined,
        warehouseId,
        paymentType,
        items: saleItems.map((line) => {
          const saleLine = {
            itemId: line.itemId,
            quantity: Number(line.quantity || 0),
          };

          if (line.unitSellingPrice !== undefined && line.unitSellingPrice !== null) {
            saleLine.unitSellingPrice = Number(line.unitSellingPrice);
          }

          return saleLine;
        }),
      };

      if (paymentType === 'credit' && amountPaid !== '') {
        payload.amountPaid = Number(amountPaid || 0);
      }

      await api.createSale(token, payload);
      Alert.alert('Success', 'Sale created successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const addItemLine = () => {
    const nextQuantity = Number(quantity || 0);
    const nextUnitSellingPrice = unitSellingPrice === '' ? null : Number(unitSellingPrice);
    const alreadySelectedQty = Number(saleItems.find((line) => line.itemId === itemId)?.quantity || 0);
    const requestedTotalQty = alreadySelectedQty + nextQuantity;
    const availableQty = getAvailableQuantity(itemId, warehouseId);

    if (!itemId) {
      Alert.alert('Validation', 'Select an item');
      return;
    }

    if (nextQuantity <= 0) {
      Alert.alert('Validation', 'Quantity must be greater than 0');
      return;
    }

    if (requestedTotalQty > availableQty) {
      Alert.alert('Validation', `Only ${availableQty} units available in selected warehouse`);
      return;
    }

    if (nextUnitSellingPrice !== null && nextUnitSellingPrice <= 0) {
      Alert.alert('Validation', 'Override price must be greater than 0');
      return;
    }

    setSaleItems((prev) => {
      const existingIndex = prev.findIndex((line) => line.itemId === itemId);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: Number(next[existingIndex].quantity || 0) + nextQuantity,
          unitSellingPrice: nextUnitSellingPrice !== null ? nextUnitSellingPrice : next[existingIndex].unitSellingPrice,
        };
        return next;
      }

      return [...prev, { itemId, quantity: nextQuantity, unitSellingPrice: nextUnitSellingPrice }];
    });

    setQuantity('1');
    setUnitSellingPrice('');
  };

  const removeItemLine = (lineItemId) => {
    setSaleItems((prev) => prev.filter((line) => line.itemId !== lineItemId));
  };

  const getItemLabel = (lineItemId) => {
    const item = items.find((entry) => entry._id === lineItemId);
    return item ? item.name : lineItemId;
  };

  const getItemDefaultSellingPrice = (lineItemId) => {
    const item = items.find((entry) => entry._id === lineItemId);
    return item ? item.sellingPrice : '-';
  };

  const getEntityId = (entity) => (typeof entity === 'object' && entity !== null ? entity._id : entity);

  const getAvailableQuantity = (selectedItemId, selectedWarehouseId) => {
    const matchingStock = stock.find((entry) => {
      const entryItemId = getEntityId(entry.item);
      const entryWarehouseId = getEntityId(entry.warehouse);
      return entryItemId === selectedItemId && entryWarehouseId === selectedWarehouseId;
    });

    return Number(matchingStock?.quantity || 0);
  };

  const availableQuantity = getAvailableQuantity(itemId, warehouseId);
  const selectedQuantity = Number(saleItems.find((line) => line.itemId === itemId)?.quantity || 0);
  const remainingAfterSelection = Math.max(0, availableQuantity - selectedQuantity);

  useEffect(() => {
    loadOptions();
  }, []);

  return (
    <Screen>
      <Section title="New Sale" icon="add-circle-outline">
        <Text style={styles.fieldLabel}>Customer Name</Text>
        <NativeSelect
          value={customerId}
          onChange={setCustomerId}
          placeholder="Select customer"
          items={customers.map((customer) => ({ label: customer.name, value: customer._id }))}
        />
        <Text style={styles.metaText}>Or enter customer name if not listed</Text>
        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Customer name" />

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
          items={items.map((item) => ({ label: `${item.name} (Sell ${item.sellingPrice})`, value: item._id }))}
        />
        <Text style={styles.metaText}>Available in selected warehouse: {availableQuantity}</Text>
        <Text style={styles.metaText}>Remaining after selected lines: {remainingAfterSelection}</Text>

        <Text style={styles.fieldLabel}>Quantity</Text>
        <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="Quantity" keyboardType="numeric" />
        <Text style={styles.fieldLabel}>Unit Selling Price Override (Optional)</Text>
        <TextInput
          style={styles.input}
          value={unitSellingPrice}
          onChangeText={setUnitSellingPrice}
          placeholder="Leave blank to use item default price"
          keyboardType="numeric"
        />
        <Button title="Add Item To Sale" onPress={addItemLine} color="#0f766e" />

        {saleItems.length > 0 ? (
          <View style={styles.listWrapper}>
            <Text style={styles.listTitle}>Selected Items</Text>
            {saleItems.map((line) => (
              <View key={line.itemId} style={styles.listCard}>
                <Text style={styles.listItemText}>
                  {getItemLabel(line.itemId)} | Qty: {line.quantity} | Price:{' '}
                  {line.unitSellingPrice ?? getItemDefaultSellingPrice(line.itemId)}
                  {line.unitSellingPrice ? ' (override)' : ' (default)'}
                </Text>
                <Button title="Remove" onPress={() => removeItemLine(line.itemId)} color="#dc2626" />
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.metaText}>No items added yet</Text>
        )}

        <Text style={styles.metaText}>Payment Type</Text>
        <NativeSelect
          value={paymentType}
          onChange={setPaymentType}
          placeholder="Select payment type"
          items={[
            { label: 'Cash', value: 'cash' },
            { label: 'Credit', value: 'credit' },
          ]}
        />

        {paymentType === 'credit' ? (
          <>
            <Text style={styles.fieldLabel}>Initial Amount Paid</Text>
            <TextInput
              style={styles.input}
              value={amountPaid}
              onChangeText={setAmountPaid}
              placeholder="Initial amount paid (optional)"
              keyboardType="numeric"
            />
          </>
        ) : null}

        <Button title="Create Sale" onPress={createSale} color="#2563eb" />
      </Section>
    </Screen>
  );
}
