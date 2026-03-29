import React, { useCallback, useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../api';
import { RecordList, Screen, Section, styles } from '../../../components/ui';

export default function WarehouseSetupScreen({ navigation }) {
  const { token, user } = useAuth();
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const canManageWarehouse = ['admin', 'manager'].includes(user.role);

  const loadWarehouses = useCallback(async () => {
    try {
      const data = await api.getWarehouses(token);
      setWarehouses(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  const createWarehouse = async () => {
    try {
      await api.createWarehouse(token, { name: warehouseName, location: warehouseLocation });
      setWarehouseName('');
      setWarehouseLocation('');
      await loadWarehouses();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadWarehouses();
    }, [loadWarehouses]),
  );

  return (
    <Screen>
      <Section title="Warehouse Management" icon="business-outline">
        {canManageWarehouse ? (
          <>
            <Text style={styles.fieldLabel}>Warehouse Name</Text>
            <TextInput style={styles.input} value={warehouseName} onChangeText={setWarehouseName} placeholder="Warehouse name" />
            <Text style={styles.fieldLabel}>Warehouse Location</Text>
            <TextInput style={styles.input} value={warehouseLocation} onChangeText={setWarehouseLocation} placeholder="Warehouse location" />
            <Button title="Create Warehouse" onPress={createWarehouse} color="#0284c7" />
            <View style={styles.spacer} />
          </>
        ) : (
          <Text style={styles.metaText}>Only admin/manager can create warehouses.</Text>
        )}
        <RecordList
          title="Warehouses"
          data={warehouses}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'location', title: 'Location', render: (item) => item.location || '-' },
          ]}
          onRowPress={(item) =>
            navigation.navigate('RowDetail', {
              title: 'Warehouse Details',
              details: item,
            })
          }
        />
      </Section>
    </Screen>
  );
}
