import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { RecordDetailModal, RecordList, Screen, Section } from '../../components/ui';

export default function Ledger() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const canDeleteLedger = user?.role === 'admin';

  const loadEntries = useCallback(async () => {
    try {
      const ledgerData = await api.getLedger(token);
      setEntries(ledgerData);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  return (
    <Screen>
      <Section title="Ledger Entries" icon="LED">
        <div className="actions-row">
          <button className="btn" onClick={() => navigate('/org/ledger/new')}>New Ledger Entry</button>
        </div>
        {error ? <div className="meta-text">{error}</div> : null}
        <RecordList
          title="Ledger Table"
          data={entries}
          columns={[
            { key: 'entryDate', title: 'Date' },
            {
              key: 'type',
              title: 'Type',
              render: (row) => (
                <span style={{ color: row?.type === 'credit' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                  {row?.type || '-'}
                </span>
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
          onRowPress={(item) => setDetailModal({ title: 'Ledger Row Details', details: item })}
        />
        {canDeleteLedger ? <div className="meta-text">Admins can delete from backend tools if needed.</div> : null}
      </Section>

      {detailModal && (
        <RecordDetailModal
          title={detailModal.title}
          details={detailModal.details}
          onClose={() => setDetailModal(null)}
        />
      )}
    </Screen>
  );
}
