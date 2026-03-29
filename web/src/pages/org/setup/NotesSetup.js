import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api';
import { useAuth } from '../../../auth/AuthContext';
import { RecordList, Screen, Section, Select } from '../../../components/ui';

export default function NotesSetup() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [noteType, setNoteType] = useState('credit');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [linkedTransactionId, setLinkedTransactionId] = useState('');
  const [error, setError] = useState('');
  const canCreateNotes = ['admin', 'manager'].includes(user.role);

  const loadNotes = useCallback(async () => {
    try {
      const data = await api.getNotes(token);
      setNotes(data);
      setError('');
    } catch (err) {
      setError(err.message);
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
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return (
    <Screen>
      <Section title="Credit / Debit Notes" icon="NOT">
        {canCreateNotes ? (
          <>
            <div className="field-label">Note Type</div>
            <Select
              value={noteType}
              onChange={setNoteType}
              placeholder="Select note type"
              items={[
                { label: 'Credit', value: 'credit' },
                { label: 'Debit', value: 'debit' },
              ]}
            />
            <label className="field-label">Customer Name</label>
            <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
            <label className="field-label">Amount</label>
            <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
            <label className="field-label">Description</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
            <label className="field-label">Linked Transaction ID</label>
            <input className="input" value={linkedTransactionId} onChange={(e) => setLinkedTransactionId(e.target.value)} placeholder="Linked transaction id" />
            <div className="actions-row">
              <button className="btn secondary" onClick={createNote}>Create Note</button>
            </div>
          </>
        ) : (
          <div className="meta-text">View-only access for your role.</div>
        )}
        {error ? <div className="meta-text">{error}</div> : null}
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
            navigate('/org/detail', {
              state: {
                title: 'Note Details',
                details: item,
              },
            })
          }
        />
      </Section>
    </Screen>
  );
}
