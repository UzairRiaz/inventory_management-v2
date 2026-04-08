import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { RecordList, Screen, Section, Select } from '../../components/ui';

export default function Purchase() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canPurchase = ['admin', 'manager'].includes(user?.role);

  const loadOptions = useCallback(async () => {
    try {
      const [warehouseData, itemData] = await Promise.all([
        api.getWarehouses(token),
        api.getItems(token),
      ]);
      setWarehouses(warehouseData);
      setItems(itemData);
      if (!warehouseId && warehouseData[0]?._id) setWarehouseId(warehouseData[0]._id);
      if (!itemId && itemData[0]?._id) {
        setItemId(itemData[0]._id);
        setPurchasePrice(String(itemData[0].manufacturingPrice ?? ''));
      }
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  // Pre-fill purchase price when item changes
  const handleItemChange = (id) => {
    setItemId(id);
    const found = items.find((i) => i._id === id);
    if (found) setPurchasePrice(String(found.manufacturingPrice ?? ''));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!warehouseId || !itemId) {
      setError('Please select a warehouse and an item');
      return;
    }
    const qty = Number(quantity || 0);
    if (qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      await api.adjustStock(token, {
        warehouseId,
        itemId,
        quantity: qty,
        type: 'IN',
        ...(purchasePrice !== '' ? { manufacturingPrice: Number(purchasePrice) } : {}),
      });

      setSuccess(`Purchase recorded — ${qty} units added to stock.`);
      setQuantity('');
      setSupplier('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const selectedItem = items.find((i) => i._id === itemId);

  return (
    <Screen>
      <Section title="Purchase" icon="PUR">
        {!canPurchase ? (
          <div className="meta-text">Only admin/manager can record purchases.</div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="field-label">Warehouse</div>
            <Select
              value={warehouseId}
              onChange={setWarehouseId}
              placeholder="Select warehouse"
              items={warehouses.map((w) => ({ label: w.name, value: w._id }))}
            />

            <div className="field-label">Item</div>
            <Select
              value={itemId}
              onChange={handleItemChange}
              placeholder="Select item"
              items={items.map((i) => ({ label: i.name, value: i._id }))}
            />

            {selectedItem && (
              <div className="meta-text" style={{ marginBottom: 4 }}>
                Current MFG price: {selectedItem.manufacturingPrice ?? '-'} &nbsp;|&nbsp; Selling price: {selectedItem.sellingPrice ?? '-'}
              </div>
            )}

            <label className="field-label">Quantity</label>
            <input
              className="input"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Quantity purchased"
            />

            <label className="field-label">Purchase Price per Unit (updates MFG cost)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="Purchase price (leave blank to keep existing)"
            />

            <label className="field-label">Supplier / Note (optional)</label>
            <input
              className="input"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Supplier name or note"
            />

            {error ? <div className="meta-text" style={{ color: '#dc2626' }}>{error}</div> : null}
            {success ? <div className="meta-text" style={{ color: '#16a34a' }}>{success}</div> : null}

            <div className="actions-row">
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? 'Recording...' : 'Record Purchase'}
              </button>
              <button className="btn ghost" type="button" onClick={() => navigate('/org/inventory')}>
                View Inventory
              </button>
            </div>
          </form>
        )}
      </Section>

      <Section title="Items Reference" icon="ITM">
        <RecordList
          title="Items"
          data={items}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'manufacturingPrice', title: 'MFG Price' },
            { key: 'sellingPrice', title: 'Sell Price' },
          ]}
          onRowPress={(item) => handleItemChange(item._id)}
        />
      </Section>
    </Screen>
  );
}
