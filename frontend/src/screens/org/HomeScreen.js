import React, { useCallback, useState } from 'react';
import { Alert, Button, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { RecordList, Screen, Section, styles } from '../../components/ui';

export default function HomeScreen() {
  const { token, user, signOut } = useAuth();
  const [summary, setSummary] = useState({ users: 0, items: 0, stock: 0, ledger: 0 });
  const [recentSales, setRecentSales] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const loadSummary = useCallback(async () => {
    try {
      const [users, items, stock, ledger, sales, payments] = await Promise.all([
        api.getUsers(token),
        api.getItems(token),
        api.getStock(token),
        api.getLedger(token),
        api.getSales(token),
        api.getIncomingPayments(token),
      ]);
      setSummary({ users: users.length, items: items.length, stock: stock.length, ledger: ledger.length });
      setRecentSales(sales.slice(0, 5));
      setRecentPayments(payments.slice(0, 5));
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary]),
  );

  return (
    <Screen>
      <Section title="Organization Dashboard" icon="home-outline">
        <Text style={styles.metaText}>User: {user.name}</Text>
        <Text style={styles.metaText}>Role: {user.role}</Text>
        <Text style={styles.metaText}>Organization: {user.organizationName || user.organizationId}</Text>
        <Text style={styles.metaText}>Users: {summary.users}</Text>
        <Text style={styles.metaText}>Items: {summary.items}</Text>
        <Text style={styles.metaText}>Stock records: {summary.stock}</Text>
        <Text style={styles.metaText}>Ledger entries: {summary.ledger}</Text>
        <RecordList
          title="Recent Sales"
          data={recentSales}
          columns={[
            { key: 'soldAt', title: 'Date' },
            { key: 'customerName', title: 'Customer' },
            { key: 'sellingTotal', title: 'Total' },
          ]}
        />
        <RecordList
          title="Recent Payments"
          data={recentPayments}
          columns={[
            { key: 'paymentDate', title: 'Date' },
            { key: 'customerName', title: 'Customer' },
            { key: 'paymentAmount', title: 'Amount' },
          ]}
        />
        <Button title="Logout" onPress={signOut} color="#b91c1c" />
      </Section>
    </Screen>
  );
}
