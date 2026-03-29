import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { RecordList, Screen, Section, styles } from '../../components/ui';

export default function LedgerScreen({ navigation }) {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState([]);

  const canDeleteLedger = user.role === 'admin';

  const loadEntries = useCallback(async () => {
    try {
      const ledgerData = await api.getLedger(token);
      setEntries(ledgerData);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  const deleteEntry = async (entryId) => {
    try {
      await api.deleteLedger(token, entryId);
      await loadEntries();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries]),
  );

  return (
    <Screen>
      <Section title="Ledger Entries" icon="book-outline">
        {entries.length === 0 ? (
          <Text style={styles.metaText}>No entries found</Text>
        ) : (
          <RecordList
            title="Ledger Table"
            data={entries}
            columns={[
              { key: 'entryDate', title: 'Date' },
              {
                key: 'type',
                title: 'Type',
                render: (row) => (
                  <Text style={row?.type === 'credit' ? localStyles.creditText : localStyles.debitText}>
                    {row?.type || '-'}
                  </Text>
                ),
              },
              { key: 'amount', title: 'Amount' },
              {
                key: 'description',
                title: 'Description',
                render: (row) => {
                  const value = String(row?.description || '-');
                  return value.length > 30 ? `${value.slice(0, 20)}...` : value;
                },
              },
            ]}
            onRowPress={(item) =>
              navigation.navigate('RowDetail', {
                title: 'Ledger Row Details',
                details: item,
              })
            }
          />
        )}
        {canDeleteLedger ? <Text style={styles.metaText}>Admins can delete from backend tools if needed.</Text> : null}
      </Section>
    </Screen>
  );
}

const localStyles = StyleSheet.create({
  creditText: {
    color: '#16a34a',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  debitText: {
    color: '#dc2626',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
