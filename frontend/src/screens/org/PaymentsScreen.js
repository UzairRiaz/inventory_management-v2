import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { RecordList, Screen, Section } from '../../components/ui';

export default function PaymentsScreen({ navigation }) {
  const { token, user } = useAuth();
  const [outstanding, setOutstanding] = useState([]);
  const [outstandingByCustomer, setOutstandingByCustomer] = useState([]);
  const [incomingPayments, setIncomingPayments] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);

  const loadPaymentData = useCallback(async () => {
    try {
      const [outstandingData, paymentData, customerPaymentData] = await Promise.all([
        api.getOutstandingCreditSales(token),
        api.getIncomingPayments(token),
        api.getCustomerPayments(token),
      ]);
      setOutstanding(outstandingData);
      setIncomingPayments(paymentData);
      setCustomerPayments(customerPaymentData);
      const customerOutstanding = await api.getOutstandingByCustomer(token);
      setOutstandingByCustomer(customerOutstanding);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadPaymentData();
    }, [loadPaymentData]),
  );

  return (
    <Screen>
      <Section title="Payments" icon="cash-outline">
        <RecordList
          title="Outstanding Credit Sales"
          data={outstanding}
          columns={[
            { key: 'customerName', title: 'Customer' },
            { key: 'sellingTotal', title: 'Total' },
            { key: 'amountPaid', title: 'Paid' },
            { key: 'remainingAmount', title: 'Remaining' },
          ]}
          onRowPress={(sale) =>
            navigation.navigate('RowDetail', {
              title: 'Outstanding Sale Details',
              details: sale,
            })
          }
        />
        <RecordList
          title="Outstanding By Customer"
          data={outstandingByCustomer}
          columns={[
            { key: 'customerName', title: 'Customer' },
            { key: 'totalOutstanding', title: 'Outstanding' },
            { key: 'totalSales', title: 'Sales' },
            { key: 'lastSaleDate', title: 'Last Sale' },
          ]}
          onRowPress={(row) =>
            navigation.navigate('CustomerSales', {
              customerId: row.customerId,
              customerName: row.customerName,
              openingBalance: row.openingBalance,
              totalOutstanding: row.totalOutstanding,
            })
          }
        />
        <RecordList
          title="Incoming Payments"
          data={incomingPayments}
          columns={[
            { key: 'customerName', title: 'Customer' },
            { key: 'paymentAmount', title: 'Payment' },
            { key: 'remainingAmount', title: 'Remaining' },
            { key: 'paymentDate', title: 'Date' },
          ]}
          onRowPress={(payment) =>
            navigation.navigate('RowDetail', {
              title: 'Payment Details',
              details: payment,
              deleteAction: payment.paymentId && ['admin', 'manager'].includes(user?.role)
                ? {
                    type: 'payment',
                    saleId: payment.saleId,
                    paymentId: payment.paymentId,
                    label: 'Delete Payment',
                  }
                : null,
            })
          }
        />
        <RecordList
          title="Customer Outstanding Payments"
          data={customerPayments}
          columns={[
            { key: 'customerName', title: 'Customer' },
            { key: 'paymentAmount', title: 'Payment' },
            { key: 'remainingOutstanding', title: 'Remaining' },
            { key: 'paymentDate', title: 'Date' },
          ]}
          onRowPress={(payment) =>
            navigation.navigate('RowDetail', {
              title: 'Customer Payment Details',
              details: payment,
            })
          }
        />
      </Section>
    </Screen>
  );
}
