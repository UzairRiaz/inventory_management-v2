import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api';
import { useAuth } from '../../../auth/AuthContext';
import { Modal, RecordList, Screen, Section } from '../../../components/ui';

export default function ItemsSetup() {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemTags, setItemTags] = useState('');
  const [manufacturingPrice, setManufacturingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [createName, setCreateName] = useState('');
  const [createTags, setCreateTags] = useState('');
  const [createMfgPrice, setCreateMfgPrice] = useState('');
  const [createSellPrice, setCreateSellPrice] = useState('');
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const canManageItems = ['admin', 'manager'].includes(user.role);

  const loadItems = useCallback(async () => {
    try {
      const data = await api.getItems(token);
      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const openEdit = (item) => {
    setEditingItem(item);
    setItemName(item.name || '');
    setItemTags(Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''));
    setManufacturingPrice(item.manufacturingPrice != null ? String(item.manufacturingPrice) : '');
    setSellingPrice(item.sellingPrice != null ? String(item.sellingPrice) : '');
    setModalError('');
  };

  const closeModal = () => {
    setEditingItem(null);
    setModalError('');
  };

  const createItem = async () => {
    try {
      await api.createItem(token, {
        name: createName,
        tags: createTags,
        manufacturingPrice: Number(createMfgPrice || 0),
        sellingPrice: Number(createSellPrice || 0),
      });
      setCreateName('');
      setCreateTags('');
      setCreateMfgPrice('');
      setCreateSellPrice('');
      setError('');
      await loadItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveEdit = async () => {
    try {
      await api.updateItem(token, editingItem._id, {
        name: itemName,
        tags: itemTags,
        manufacturingPrice: Number(manufacturingPrice || 0),
        sellingPrice: Number(sellingPrice || 0),
      });
      closeModal();
      await loadItems();
    } catch (err) {
      setModalError(err.message);
    }
  };

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <Screen>
      <Section title="Item Management" icon="ITM">
        {canManageItems ? (
          <>
            <label className="field-label">Item Name</label>
            <input className="input" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Item name" />
            <label className="field-label">Tags</label>
            <input className="input" value={createTags} onChange={(e) => setCreateTags(e.target.value)} placeholder="Tags (comma separated)" />
            <label className="field-label">Manufacturing Price</label>
            <input className="input" value={createMfgPrice} onChange={(e) => setCreateMfgPrice(e.target.value)} placeholder="Manufacturing price" type="number" />
            <label className="field-label">Selling Price</label>
            <input className="input" value={createSellPrice} onChange={(e) => setCreateSellPrice(e.target.value)} placeholder="Selling price" type="number" />
            <div className="actions-row">
              <button className="btn" onClick={createItem}>Create Item</button>
            </div>
          </>
        ) : (
          <div className="meta-text">Only admin/manager can create items.</div>
        )}
        {error ? <div className="meta-text">{error}</div> : null}
        <RecordList
          title="Items"
          data={items}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'manufacturingPrice', title: 'MFG Price' },
            { key: 'sellingPrice', title: 'Sell Price' },
          ]}
          onRowPress={(item) => openEdit(item)}
        />
      </Section>

      {editingItem && (
        <Modal title={`Edit Item: ${editingItem.name}`} onClose={closeModal}>
          <label className="field-label">Item Name</label>
          <input className="input" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item name" />
          <label className="field-label">Tags</label>
          <input className="input" value={itemTags} onChange={(e) => setItemTags(e.target.value)} placeholder="Tags (comma separated)" />
          <label className="field-label">Manufacturing Price</label>
          <input className="input" value={manufacturingPrice} onChange={(e) => setManufacturingPrice(e.target.value)} placeholder="Manufacturing price" type="number" />
          <label className="field-label">Selling Price</label>
          <input className="input" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="Selling price" type="number" />
          {modalError ? <div className="meta-text" style={{ color: 'var(--danger)' }}>{modalError}</div> : null}
          <div className="actions-row">
            {canManageItems ? (
              <>
                <button className="btn" onClick={saveEdit}>Save Changes</button>
                <button className="btn ghost" onClick={closeModal}>Cancel</button>
              </>
            ) : (
              <button className="btn ghost" onClick={closeModal}>Close</button>
            )}
          </div>
        </Modal>
      )}
    </Screen>
  );
}
