import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Modal, RecordList, Screen, Section, Select } from '../../components/ui';

// ── PurchaseModal ──────────────────────────────────────────────────────────────
function PurchaseModal({ purchase, onClose, onRefresh, canEdit }) {
  const { token } = useAuth();
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'pay'

  // Edit fields
  const [supplier, setSupplier] = useState(purchase.supplier || '');
  const [note, setNote] = useState(purchase.note || '');
  const [purchasedAt, setPurchasedAt] = useState(
    purchase.purchasedAt ? new Date(purchase.purchasedAt).toISOString().slice(0, 10) : '',
  );

  // Payment fields
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetError = () => setError('');

  const handlePay = async (e) => {
    e.preventDefault();
    const amt = Number(payAmount || 0);
    if (amt <= 0 || amt > purchase.remainingAmount) {
      setError(`Enter a valid amount (max ${purchase.remainingAmount})`);
      return;
    }
    setSubmitting(true);
    resetError();
    try {
      await api.recordPurchasePayment(token, purchase._id, { amount: amt, note: payNote });
      await onRefresh(purchase._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    resetError();
    try {
      await api.updatePurchase(token, purchase._id, { supplier, note, purchasedAt });
      await onRefresh(purchase._id);
      setMode('view');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Void this purchase? Stock will be reversed. This cannot be undone.')) return;
    setSubmitting(true);
    resetError();
    try {
      await api.deletePurchase(token, purchase._id);
      onClose(purchase._id); // signal deletion
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Purchase Details" onClose={() => onClose(null)}>
      {mode === 'view' && (
        <>
          <table className="detail-table">
            <tbody>
              <tr><td>Item</td><td>{purchase.item?.name || '-'}</td></tr>
              <tr><td>Warehouse</td><td>{purchase.warehouse?.name || '-'}</td></tr>
              <tr><td>Quantity</td><td>{purchase.quantity}</td></tr>
              <tr><td>Unit Price</td><td>{purchase.unitPrice}</td></tr>
              <tr><td>Total Amount</td><td><strong>{purchase.totalAmount}</strong></td></tr>
              <tr>
                <td>Payment Type</td>
                <td style={{ color: purchase.paymentType === 'credit' ? 'var(--warning)' : 'var(--success)', fontWeight: 700 }}>
                  {String(purchase.paymentType || '').toUpperCase()}
                </td>
              </tr>
              <tr><td>Paid</td><td>{purchase.paidAmount}</td></tr>
              <tr>
                <td>Remaining</td>
                <td style={{ color: purchase.remainingAmount > 0 ? 'var(--warning)' : undefined, fontWeight: purchase.remainingAmount > 0 ? 700 : undefined }}>
                  {purchase.remainingAmount}
                </td>
              </tr>
              <tr><td>Supplier</td><td>{purchase.supplier || '-'}</td></tr>
              <tr><td>Date</td><td>{purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : '-'}</td></tr>
              <tr><td>Note</td><td>{purchase.note || '-'}</td></tr>
            </tbody>
          </table>

          {purchase.payments?.length > 0 && (
            <>
              <div style={{ fontWeight: 600, margin: '12px 0 4px' }}>Payment History</div>
              <table className="detail-table">
                <thead>
                  <tr><th>Amount</th><th>Date</th><th>Note</th><th>By</th></tr>
                </thead>
                <tbody>
                  {purchase.payments.map((p, i) => (
                    <tr key={p._id || i}>
                      <td>{p.amount}</td>
                      <td>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '-'}</td>
                      <td>{p.note || '-'}</td>
                      <td>{p.recordedBy || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {error && <div className="meta-text" style={{ color: '#dc2626', marginTop: 8 }}>{error}</div>}

          {canEdit && (
            <div className="actions-row" style={{ marginTop: 16 }}>
              {purchase.paymentType === 'credit' && purchase.remainingAmount > 0 && (
                <button className="btn" onClick={() => { resetError(); setMode('pay'); }}>
                  Record Payment
                </button>
              )}
              <button className="btn ghost" onClick={() => { resetError(); setMode('edit'); }}>Edit</button>
              <button className="btn danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Voiding…' : 'Void Purchase'}
              </button>
            </div>
          )}
        </>
      )}

      {mode === 'pay' && (
        <form onSubmit={handlePay}>
          <div className="meta-text" style={{ marginBottom: 8 }}>
            Remaining balance: <strong>{purchase.remainingAmount}</strong>
          </div>
          <label className="field-label">Amount Paid</label>
          <input
            className="input"
            type="number"
            min="0.01"
            max={purchase.remainingAmount}
            step="any"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder={`Max ${purchase.remainingAmount}`}
            autoFocus
          />
          <label className="field-label">Note (optional)</label>
          <input
            className="input"
            value={payNote}
            onChange={(e) => setPayNote(e.target.value)}
            placeholder="e.g. Bank transfer"
          />
          {error && <div className="meta-text" style={{ color: '#dc2626' }}>{error}</div>}
          <div className="actions-row" style={{ marginTop: 12 }}>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Confirm Payment'}
            </button>
            <button className="btn ghost" type="button" onClick={() => { setMode('view'); resetError(); }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'edit' && (
        <form onSubmit={handleEdit}>
          <label className="field-label">Supplier / Vendor</label>
          <input
            className="input"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Supplier name"
          />
          <label className="field-label">Purchase Date</label>
          <input
            className="input"
            type="date"
            value={purchasedAt}
            onChange={(e) => setPurchasedAt(e.target.value)}
          />
          <label className="field-label">Note</label>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
          />
          {error && <div className="meta-text" style={{ color: '#dc2626' }}>{error}</div>}
          <div className="actions-row" style={{ marginTop: 12 }}>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
            <button className="btn ghost" type="button" onClick={() => { setMode('view'); resetError(); }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ── Purchase page ──────────────────────────────────────────────────────────────
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
  const [note, setNote] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [purchasedAt, setPurchasedAt] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Purchases list
  const [purchases, setPurchases] = useState([]);
  const [detailModal, setDetailModal] = useState(null);

  const canPurchase = ['admin', 'manager'].includes(user?.role);

  // Re-fetch purchases and update the open modal if needed
  const handleRefresh = useCallback(async (purchaseId) => {
    const updated = await api.getPurchases(token);
    setPurchases(updated);
    if (purchaseId) {
      const fresh = updated.find((p) => p._id === purchaseId);
      setDetailModal(fresh || null);
    }
  }, [token]);

  const loadOptions = useCallback(async () => {
    try {
      const [warehouseData, itemData, purchaseData] = await Promise.all([
        api.getWarehouses(token),
        api.getItems(token),
        api.getPurchases(token),
      ]);
      setWarehouses(warehouseData);
      setItems(itemData);
      setPurchases(purchaseData);

      if (!warehouseId && warehouseData[0]?._id) setWarehouseId(warehouseData[0]._id);
      if (!itemId && itemData[0]?._id) {
        setItemId(itemData[0]._id);
        setPurchasePrice(String(itemData[0].manufacturingPrice ?? ''));
      }
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

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
      await api.createPurchase(token, {
        warehouseId,
        itemId,
        quantity: qty,
        unitPrice: purchasePrice !== '' ? Number(purchasePrice) : 0,
        supplier,
        note,
        paymentType,
        purchasedAt: purchasedAt || undefined,
      });

      const label = paymentType === 'credit' ? 'credit purchase' : 'cash purchase';
      setSuccess(`Purchase recorded — ${qty} units added to stock (${label}).`);
      setQuantity('');
      setSupplier('');
      setNote('');
      setPurchasedAt('');
      setPaymentType('cash');

      const updated = await api.getPurchases(token);
      setPurchases(updated);
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
  const qty = Number(quantity || 0);
  const price = Number(purchasePrice || 0);
  const estimatedTotal = qty > 0 && price > 0 ? qty * price : null;

  return (
    <Screen>
      <Section title="Record Purchase" icon="PUR">
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

            <label className="field-label">Purchase Price per Unit</label>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="Price per unit (also updates MFG cost)"
            />

            {estimatedTotal !== null && (
              <div className="meta-text" style={{ marginBottom: 4 }}>
                Estimated total: <strong>{estimatedTotal.toFixed(2)}</strong>
              </div>
            )}

            <label className="field-label">Payment Type</label>
            <Select
              value={paymentType}
              onChange={setPaymentType}
              items={[
                { label: 'Cash — paid now', value: 'cash' },
                { label: 'Credit — pay later', value: 'credit' },
              ]}
            />

            {paymentType === 'credit' && (
              <div className="meta-text" style={{ color: 'var(--warning)', marginBottom: 4 }}>
                This will be recorded as a payable (Amount to Pay on the dashboard).
              </div>
            )}

            <label className="field-label">Supplier / Vendor (optional)</label>
            <input
              className="input"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Supplier name"
            />

            <label className="field-label">Purchase Date (optional)</label>
            <input
              className="input"
              type="date"
              value={purchasedAt}
              onChange={(e) => setPurchasedAt(e.target.value)}
            />

            <label className="field-label">Note (optional)</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
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

      <Section title="Purchase History" icon="HIS">
        <RecordList
          title="Purchases"
          data={purchases}
          columns={[
            { key: 'purchasedAt', title: 'Date' },
            { key: 'item', title: 'Item', render: (p) => p.item?.name || '-' },
            { key: 'quantity', title: 'Qty' },
            { key: 'unitPrice', title: 'Unit Price' },
            { key: 'totalAmount', title: 'Total' },
            {
              key: 'paymentType',
              title: 'Payment',
              render: (p) => (
                <span style={{ color: p.paymentType === 'credit' ? 'var(--warning)' : 'var(--success)', fontWeight: 700 }}>
                  {String(p.paymentType || '').toUpperCase()}
                </span>
              ),
            },
            { key: 'remainingAmount', title: 'Remaining' },
            { key: 'supplier', title: 'Supplier', render: (p) => p.supplier || '-' },
          ]}
          onRowPress={(p) => setDetailModal(p)}
        />
      </Section>

      {detailModal && (
        <PurchaseModal
          purchase={detailModal}
          onClose={(deletedId) => {
            if (deletedId) setPurchases((prev) => prev.filter((p) => p._id !== deletedId));
            setDetailModal(null);
          }}
          onRefresh={handleRefresh}
          canEdit={canPurchase}
        />
      )}
    </Screen>
  );
}
