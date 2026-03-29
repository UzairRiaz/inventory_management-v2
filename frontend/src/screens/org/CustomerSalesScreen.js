import React, { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { RecordList, Screen, Section, styles } from '../../components/ui';

export default function CustomerSalesScreen({ navigation, route }) {
  const { token } = useAuth();
  const { customerId, customerName, openingBalance, totalOutstanding } = route.params || {};
  const [sales, setSales] = useState([]);

  const loadSales = useCallback(async () => {
    try {
      const data = await api.getSalesByCustomer(token, customerId, customerName);
      setSales(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token, customerId, customerName]);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales]),
  );

  return (
    <Screen>
      <Section title="Customer Sales" icon="cart-outline">
        <Text style={styles.metaText}>Customer: {customerName || '-'}</Text>
        <Text style={styles.metaText}>Opening Outstanding: {openingBalance ?? 0}</Text>
        <Text style={styles.metaText}>Total Outstanding: {totalOutstanding ?? '-'}</Text>
        <Text style={styles.metaText}>
          Outstanding from Sales: {sales.reduce((sum, sale) => sum + Number(sale.remainingAmount || 0), 0)}
        </Text>
        {sales.length === 0 ? (
          <Text style={styles.metaText}>No sales found for this customer.</Text>
        ) : (
          <RecordList
            title="Sales"
            data={sales}
            columns={[
              { key: 'soldAt', title: 'Date' },
              { key: 'customerName', title: 'Customer', render: (sale) => sale.customer?.name || sale.customerName },
              { key: 'paymentType', title: 'Type', render: (sale) => String(sale.paymentType || '').toUpperCase() },
              { key: 'sellingTotal', title: 'Total' },
              { key: 'amountPaid', title: 'Paid' },
              { key: 'remainingAmount', title: 'Remaining' },
            ]}
            onRowPress={(sale) =>
              navigation.navigate('RowDetail', {
                title: 'Sale Details',
                details: {
                  id: sale._id,
                  customerName: sale.customer?.name || sale.customerName,
                  paymentType: sale.paymentType,
                  soldAt: sale.soldAt,
                  sellingTotal: sale.sellingTotal,
                  amountPaid: sale.amountPaid,
                  remainingAmount: sale.remainingAmount,
                  manufacturingTotal: sale.manufacturingTotal,
                  profit: sale.profit,
                  items: sale.items,
                  payments: sale.payments,
                },
              })
            }
          />
        )}
      </Section>
    </Screen>
  );
}
