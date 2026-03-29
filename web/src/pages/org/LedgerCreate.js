import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Screen, Section, Select } from '../../components/ui';

export default function LedgerCreate() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('credit');
  const [error, setError] = useState('');

  const canEditLedger = ['admin', 'manager'].includes(user.role);

  const loadItems = async () => {
    try {
      const itemData = await api.getItems(token);
      setItems(itemData);
      if (!itemId && itemData[0]?._id) setItemId(itemData[0]._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const createEntry = async () => {
    try {
      if (!canEditLedger) {
        setError('You do not have permission to create ledger entries');
        return;
      }

      const payload = { description, type };
      if (amount !== '') payload.amount = Number(amount || 0);
      if (itemId) {
        payload.itemId = itemId;
        payload.quantity = Number(quantity || 1);
        if (unitPrice !== '') payload.unitPrice = Number(unitPrice || 0);
      }

      await api.createLedger(token, payload);
      navigate('/org/ledger');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <Screen>
      <Section title="New Ledger Entry" icon="NEW">
        <div className="field-label">Entry Type</div>
        <Select
          value={type}
          onChange={setType}
          placeholder="Select entry type"
          items={[
            { label: 'Credit', value: 'credit' },
            { label: 'Debit', value: 'debit' },
          ]}
        />

        <div className="field-label">Item (optional for quick entry)</div>
        <Select
          value={itemId}
          onChange={setItemId}
          placeholder="No item"
          items={[{ label: 'No item', value: '' }, ...items.map((item) => ({ label: `${item.name} (Sell ${item.sellingPrice})`, value: item._id }))]}
        />

        {itemId ? (
          <>
            <label className="field-label">Quantity</label>
            <input className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" />
            <label className="field-label">Unit Price</label>
            <input
              className="input"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="Unit price (optional, auto from item if blank)"
            />
          </>
        ) : null}

        <label className="field-label">Description</label>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />

        <label className="field-label">Amount</label>
        <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (optional when item selected)" />

        {error ? <div className="meta-text">{error}</div> : null}
        <div className="actions-row">
          <button className="btn success" onClick={createEntry}>Create Ledger Entry</button>
        </div>
      </Section>
    </Screen>
  );
}
