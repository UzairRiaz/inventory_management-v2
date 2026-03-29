import React, { useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { Screen, Section, styles } from '../../components/ui';

export default function ProfitScreen() {
  const { token } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState(null);

  const loadProfit = async () => {
    try {
      const data = await api.getSalesProfit(token, from || undefined, to || undefined);
      setSummary(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <Screen>
      <Section title="Profit Calculation (Date Range)" icon="trending-up-outline">
        <Text style={styles.fieldLabel}>From Date</Text>
        <TextInput style={styles.input} value={from} onChangeText={setFrom} placeholder="From (YYYY-MM-DD)" />
        <Text style={styles.fieldLabel}>To Date</Text>
        <TextInput style={styles.input} value={to} onChangeText={setTo} placeholder="To (YYYY-MM-DD)" />
        <Button title="Calculate Profit" onPress={loadProfit} color="#ea580c" />
        {summary ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>Manufacturing Total: {summary.manufacturingTotal}</Text>
            <Text style={styles.summaryText}>Selling Total: {summary.sellingTotal}</Text>
            <Text style={styles.summaryText}>Profit: {summary.profit}</Text>
            <Text style={styles.summaryText}>Total Sales: {summary.totalSales}</Text>
          </View>
        ) : null}
      </Section>
    </Screen>
  );
}
