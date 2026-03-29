import React, { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { RecordList, Screen, Section, styles } from '../../components/ui';

export default function InventoryScreen({ navigation }) {
  const { token, user } = useAuth();
  const [stock, setStock] = useState([]);
  const [items, setItems] = useState([]);

  const refreshAll = useCallback(async () => {
    try {
      const [itemData, stockData] = await Promise.all([api.getItems(token), api.getStock(token)]);
      setItems(itemData);
      setStock(stockData);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [refreshAll]),
  );

  const stockByItem = Object.values(
    stock.reduce((groups, entry) => {
      const itemId = entry?.item?._id || String(entry?.item || 'unknown-item');
      const itemName = entry?.item?.name || 'Unknown Item';
      const warehouseName = entry?.warehouse?.name || String(entry?.warehouse || 'Unknown Warehouse');
      const quantity = Number(entry?.quantity || 0);

      if (!groups[itemId]) {
        groups[itemId] = {
          itemId,
          itemName,
          totalQuantity: 0,
          warehouses: {},
        };
      }

      groups[itemId].totalQuantity += quantity;
      groups[itemId].warehouses[warehouseName] = (groups[itemId].warehouses[warehouseName] || 0) + quantity;

      return groups;
    }, {}),
  ).sort((a, b) => a.itemName.localeCompare(b.itemName));

  return (
    <Screen>
      <Section title="Inventory" icon="cube-outline">
        <View style={styles.summaryBox}>
          {stockByItem.length === 0 ? (
            <Text style={styles.summaryText}>No inventory data</Text>
          ) : (
            stockByItem.map((group) => (
              <Text key={group.itemId} style={styles.summaryText}>{group.itemName}: {group.totalQuantity}</Text>
            ))
          )}
        </View>

        <RecordList
          title="Items"
          data={items}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'manufacturingPrice', title: 'MFG Price' },
            { key: 'sellingPrice', title: 'Sell Price' },
          ]}
          onRowPress={(item) =>
            navigation.navigate('RowDetail', {
              title: 'Item Details',
              details: item,
            })
          }
        />
        <RecordList
          title="Stock By Item"
          data={stockByItem}
          columns={[
            { key: 'itemName', title: 'Item' },
            { key: 'totalQuantity', title: 'Total Qty' },
            {
              key: 'warehouses',
              title: 'Warehouse Breakdown',
              render: (group) =>
                Object.entries(group.warehouses)
                  .map(([warehouseName, quantity]) => `${warehouseName}: ${quantity}`)
                  .join(' | '),
            },
          ]}
          onRowPress={(group) =>
            navigation.navigate('RowDetail', {
              title: `${group.itemName} Details`,
              details: {
                item: group.itemName,
                totalQuantity: group.totalQuantity,
                ...group.warehouses,
              },
            })
          }
        />
        <RecordList
          title="Stock Entries"
          data={stock}
          columns={[
            { key: 'item', title: 'Item', render: (entry) => entry?.item?.name || '-' },
            { key: 'warehouse', title: 'Warehouse', render: (entry) => entry?.warehouse?.name || '-' },
            { key: 'quantity', title: 'Quantity' },
            { key: 'updatedAt', title: 'Updated' },
          ]}
          onRowPress={(entry) =>
            navigation.navigate('RowDetail', {
              title: 'Stock Entry Details',
              details: entry,
              deleteAction:
                ['admin', 'manager'].includes(user?.role)
                  ? {
                      type: 'stock',
                      id: entry._id,
                      label: 'Delete Stock Entry',
                    }
                  : null,
            })
          }
        />
      </Section>
    </Screen>
  );
}
