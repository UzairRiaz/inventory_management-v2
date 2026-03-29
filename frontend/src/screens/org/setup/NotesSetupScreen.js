import React, { useCallback, useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../api';
import { NativeSelect, RecordList, Screen, Section, styles } from '../../../components/ui';

export default function NotesSetupScreen({ navigation }) {
  const { token, user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [noteType, setNoteType] = useState('credit');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [linkedTransactionId, setLinkedTransactionId] = useState('');
  const canCreateNotes = ['admin', 'manager'].includes(user.role);

  const loadNotes = useCallback(async () => {
    try {
      const data = await api.getNotes(token);
      setNotes(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  const createNote = async () => {
    try {
      await api.createNote(token, {
        type: noteType,
        customerName,
        amount: Number(amount || 0),
        description,
        linkedTransactionId,
      });
      setCustomerName('');
      setAmount('');
      setDescription('');
      setLinkedTransactionId('');
      await loadNotes();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [loadNotes]),
  );

  return (
    <Screen>
      <Section title="Credit / Debit Notes" icon="receipt-outline">
        {canCreateNotes ? (
          <>
            <Text style={styles.metaText}>Note Type</Text>
            <NativeSelect
              value={noteType}
              onChange={setNoteType}
              placeholder="Select note type"
              items={[
                { label: 'Credit', value: 'credit' },
                { label: 'Debit', value: 'debit' },
              ]}
            />
            <Text style={styles.fieldLabel}>Customer Name</Text>
            <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="Customer name" />
            <Text style={styles.fieldLabel}>Amount</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="Amount" keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Description" />
            <Text style={styles.fieldLabel}>Linked Transaction ID</Text>
            <TextInput style={styles.input} value={linkedTransactionId} onChangeText={setLinkedTransactionId} placeholder="Linked transaction id" />
            <Button title="Create Note" onPress={createNote} color="#0f766e" />
            <View style={styles.spacer} />
          </>
        ) : (
          <Text style={styles.metaText}>View-only access for your role.</Text>
        )}

        <RecordList
          title="Notes"
          data={notes}
          columns={[
            { key: 'type', title: 'Type', render: (item) => String(item.type || '').toUpperCase() },
            { key: 'customerName', title: 'Customer' },
            { key: 'amount', title: 'Amount' },
            { key: 'linkedTransactionId', title: 'Transaction', render: (item) => item.linkedTransactionId || '-' },
          ]}
          onRowPress={(item) =>
            navigation.navigate('RowDetail', {
              title: 'Note Details',
              details: item,
            })
          }
        />
      </Section>
    </Screen>
  );
}
