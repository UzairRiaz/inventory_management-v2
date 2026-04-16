import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Modal, RecordDetailModal, RecordList, Screen, Section, Select } from '../../components/ui';

function SaleEditModal({ sale, token, onClose, onSaved }) {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [stock, setStock] = useState([]);

  const [customerId, setCustomerId] = useState(sale.customer?._id || sale.customer || '');
  const [customerName, setCustomerName] = useState(sale.customerName || '');
  const [paymentType, setPaymentType] = useState(sale.paymentType || 'cash');
  const [soldAt, setSoldAt] = useState(
    sale.soldAt ? new Date(sale.soldAt).toISOString().slice(0, 16) : ''
  );

  // Build initial saleItems from existing sale
  const [saleItems, setSaleItems] = useState(
    (sale.items || []).map((line) => ({
      itemId: typeof line.item === 'object' ? line.item._id : line.item,
      itemLabel: typeof line.item === 'object' ? (line.item.name || line.item.sku) : '',
      quantity: String(line.quantity),
      unitSellingPrice: String(line.unitSellingPrice),
    }))
  );

  // For adding a new item line
  const [addItemId, setAddItemId] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [addPrice, setAddPrice] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getCustomers(token),
      api.getItems(token),
      api.getStock(token),
    ]).then(([c, i, s]) => {
      setCustomers(c);
      setItems(i);
      setStock(s);
      if (!addItemId && i[0]?._id) setAddItemId(i[0]._id);
    }).catch((err) => setError(err.message));
  }, [token]);

  const getEntityId = (entity) => (typeof entity === 'object' && entity !== null ? entity._id : entity);

  const getAvailableStock = (selectedItemId) => {
    const warehouseId = getEntityId(sale.warehouse);
    const entry = stock.find((s) => getEntityId(s.item) === selectedItemId && getEntityId(s.warehouse) === warehouseId);
    return Number(entry?.quantity || 0);
  };

  const updateLine = (index, field, value) => {
    setSaleItems((prev) => prev.map((line, i) => i === index ? { ...line, [field]: value } : line));
  };

  const removeLine = (index) => {
    setSaleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addLine = () => {
    if (!addItemId) { setError('Select an item to add'); return; }
    const qty = Number(addQty || 0);
    if (qty <= 0) { setError('Quantity must be > 0'); return; }
    const itemObj = items.find((it) => it._id === addItemId);
    const available = getAvailableStock(addItemId);
    const alreadyUsed = saleItems.filter((l) => l.itemId === addItemId).reduce((s, l) => s + Number(l.quantity || 0), 0);
    if (qty + alreadyUsed > available) { setError(`Only ${available} units available (${alreadyUsed} already in sale)`); return; }
    setSaleItems((prev) => [...prev, {
      itemId: addItemId,
      itemLabel: itemObj?.name || addItemId,
      quantity: String(qty),
      unitSellingPrice: addPrice || String(itemObj?.sellingPrice || ''),
    }]);
    setAddQty('1');
    setAddPrice('');
    setError('');
  };

  const handleSave = async () => {
    if (saleItems.length === 0) { setError('At least one item is required'); return; }
    if (!customerId && !customerName.trim()) { setError('Customer name or selection is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        customerId: customerId || undefined,
        customerName: !customerId ? customerName : undefined,
        paymentType,
        soldAt: soldAt || undefined,
        items: saleItems.map((l) => ({
          itemId: l.itemId,
          quantity: Number(l.quantity),
          unitSellingPrice: l.unitSellingPrice !== '' ? Number(l.unitSellingPrice) : undefined,
        })),
      };
      await api.updateSale(token, sale._id, payload);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const getItemLabel = (itemId) => {
    const found = items.find((it) => it._id === itemId);
    return found ? found.name : itemId;
  };

  return (
    <Modal title="Edit Sale" onClose={onClose}>
      <div className="field-label">Customer</div>
      <Select
        value={customerId}
        onChange={(val) => { setCustomerId(val); if (val) setCustomerName(''); }}
        placeholder="Select customer"
        items={customers.map((c) => ({ label: c.name, value: c._id }))}
      />
      <div className="meta-text">Or enter name directly</div>
      <input
        className="input"
        value={customerName}
        onChange={(e) => { setCustomerName(e.target.value); if (e.target.value) setCustomerId(''); }}
        placeholder="Customer name"
      />

      <div className="field-label">Payment Type</div>
      <Select
        value={paymentType}
        onChange={setPaymentType}
        placeholder="Select payment type"
        items={[
          { label: 'Cash', value: 'cash' },
          { label: 'Credit', value: 'credit' },
        ]}
      />

      <div className="field-label">Sale Date</div>
      <input
        className="input"
        type="datetime-local"
        value={soldAt}
        onChange={(e) => setSoldAt(e.target.value)}
      />

      <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Sale Items</div>
      {saleItems.length === 0 && <div className="meta-text">No items — add at least one below</div>}
      {saleItems.map((line, index) => (
        <div key={`${line.itemId}-${index}`} className="card" style={{ marginBottom: 6 }}>
          <div className="card-text" style={{ fontWeight: 600 }}>{line.itemLabel || getItemLabel(line.itemId)}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
            <label style={{ fontSize: 12 }}>Qty</label>
            <input
              className="input"
              style={{ width: 80 }}
              value={line.quantity}
              onChange={(e) => updateLine(index, 'quantity', e.target.value)}
            />
            <label style={{ fontSize: 12 }}>Unit Price</label>
            <input
              className="input"
              style={{ width: 100 }}
              value={line.unitSellingPrice}
              onChange={(e) => updateLine(index, 'unitSellingPrice', e.target.value)}
              placeholder="Override price"
            />
            <button className="btn danger" style={{ padding: '4px 10px' }} onClick={() => removeLine(index)}>Remove</button>
          </div>
        </div>
      ))}

      <div style={{ border: '1px dashed #888', borderRadius: 6, padding: 10, marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Add Item</div>
        <Select
          value={addItemId}
          onChange={setAddItemId}
          placeholder="Select item"
          items={items.map((it) => ({ label: `${it.name} (Sell: ${it.sellingPrice})`, value: it._id }))}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
          <label style={{ fontSize: 12 }}>Qty</label>
          <input className="input" style={{ width: 80 }} value={addQty} onChange={(e) => setAddQty(e.target.value)} />
          <label style={{ fontSize: 12 }}>Price Override</label>
          <input className="input" style={{ width: 100 }} value={addPrice} onChange={(e) => setAddPrice(e.target.value)} placeholder="Optional" />
          <button className="btn secondary" onClick={addLine}>Add</button>
        </div>
      </div>

      {error && <div className="meta-text" style={{ color: 'var(--danger)', marginTop: 8 }}>{error}</div>}

      <div className="actions-row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        <button className="btn ghost" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

export default function Sales() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [editSale, setEditSale] = useState(null);

  const loadSalesData = useCallback(async () => {
    try {
      const saleData = await api.getSales(token);
      setSales(saleData);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    loadSalesData();
  }, [loadSalesData]);

  const canEdit = ['admin', 'manager'].includes(user?.role);

  return (
    <Screen>
      <Section title="Sales" icon="SAL">
        <div className="actions-row">
          <button className="btn" onClick={() => navigate('/org/sales/new')}>New Sale</button>
        </div>
        {error ? <div className="meta-text">{error}</div> : null}
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
            setDetailModal({
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
              canDelete: canEdit,
              saleId: sale._id,
              rawSale: sale,
            })
          }
        />
      </Section>

      {detailModal && (
        <RecordDetailModal
          title={detailModal.title}
          details={detailModal.details}
          onClose={() => setDetailModal(null)}
          onEdit={
            canEdit
              ? () => { setDetailModal(null); setEditSale(detailModal.rawSale); }
              : undefined
          }
          editLabel="Edit Sale"
          onDelete={
            detailModal.canDelete
              ? async () => {
                  await api.deleteSale(token, detailModal.saleId);
                  const saleData = await api.getSales(token);
                  setSales(saleData);
                }
              : undefined
          }
          deleteLabel="Delete Sale"
        />
      )}

      {editSale && (
        <SaleEditModal
          sale={editSale}
          token={token}
          onClose={() => setEditSale(null)}
          onSaved={loadSalesData}
        />
      )}
    </Screen>
  );
}
