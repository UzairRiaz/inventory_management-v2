import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { RecordList, Screen, Section, styles } from '../../components/ui';

export default function SalesScreen({ navigation }) {
  const { token, user } = useAuth();
  const [sales, setSales] = useState([]);

  const loadSalesData = useCallback(async () => {
    try {
      const saleData = await api.getSales(token);
      setSales(saleData);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadSalesData();
    }, [loadSalesData]),
  );

  return (
    <Screen>
      <Section title="Sales" icon="cart-outline">
        <RecordList
          title="Sales"
          data={sales}
          columns={[
            { key: 'customerName', title: 'Customer', render: (sale) => sale.customer?.name || sale.customerName },
            { key: 'soldAt', title: 'Date' },
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
                customerName: sale.customerName,
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
              deleteAction: ['admin', 'manager'].includes(user?.role)
                ? {
                    type: 'sale',
                    id: sale._id,
                    label: 'Delete Sale',
                  }
                : null,
            })
          }
        />
      </Section>
    </Screen>
  );
}
