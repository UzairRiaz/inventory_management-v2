import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Modal, RecordDetailModal, RecordList, Screen, Section } from '../../components/ui';

export default function Inventory() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  // Item edit modal state
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemTags, setItemTags] = useState('');
  const [manufacturingPrice, setManufacturingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [itemModalError, setItemModalError] = useState('');

  // Detail modal state
  const [detailModal, setDetailModal] = useState(null); // { title, details, deleteAction }

  const canManageItems = ['admin', 'manager'].includes(user?.role);

  const refreshAll = useCallback(async () => {
    try {
      const [itemData, stockData] = await Promise.all([api.getItems(token), api.getStock(token)]);
      setItems(itemData);
      setStock(stockData);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const openItemEdit = (item) => {
    setEditingItem(item);
    setItemName(item.name || '');
    setItemTags(Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''));
    setManufacturingPrice(item.manufacturingPrice != null ? String(item.manufacturingPrice) : '');
    setSellingPrice(item.sellingPrice != null ? String(item.sellingPrice) : '');
    setItemModalError('');
  };

  const closeItemEdit = () => {
    setEditingItem(null);
    setItemModalError('');
  };

  const saveItemEdit = async () => {
    try {
      await api.updateItem(token, editingItem._id, {
        name: itemName,
        tags: itemTags,
        manufacturingPrice: Number(manufacturingPrice || 0),
        sellingPrice: Number(sellingPrice || 0),
      });
      closeItemEdit();
      await refreshAll();
    } catch (err) {
      setItemModalError(err.message);
    }
  };

  const stockByItem = Object.values(
    stock.reduce((groups, entry) => {
      const itemId = entry?.item?._id || String(entry?.item || 'unknown-item');
      const itemName = entry?.item?.name || 'Unknown Item';
      const warehouseName = entry?.warehouse?.name || String(entry?.warehouse || 'Unknown Warehouse');
      const quantity = Number(entry?.quantity || 0);

      if (!groups[itemId]) {
        groups[itemId] = { itemId, itemName, totalQuantity: 0, warehouses: {} };
      }

      groups[itemId].totalQuantity += quantity;
      groups[itemId].warehouses[warehouseName] = (groups[itemId].warehouses[warehouseName] || 0) + quantity;

      return groups;
    }, {}),
  ).sort((a, b) => a.itemName.localeCompare(b.itemName));

  return (
    <Screen>
      <Section title="Inventory" icon="INV">
        <div className="actions-row">
          <button className="btn" onClick={() => navigate('/org/inventory/new')}>Adjust Inventory</button>
        </div>
        {error ? <div className="meta-text">{error}</div> : null}
        <div className="summary-box">
          {stockByItem.length === 0 ? (
            <div className="summary-text">No inventory data</div>
          ) : (
            stockByItem.map((group) => (
              <div key={group.itemId} className="summary-text">
                {group.itemName}: {group.totalQuantity}
              </div>
            ))
          )}
        </div>

        <RecordList
          title="Items"
          data={items}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'manufacturingPrice', title: 'MFG Price' },
            { key: 'sellingPrice', title: 'Sell Price' },
          ]}
          onRowPress={(item) => {
            if (canManageItems) {
              openItemEdit(item);
            } else {
              setDetailModal({ title: 'Item Details', details: item });
            }
          }}
        />
        <RecordList
          title="Stock By Item"
          data={stockByItem}
          columns={[
            { key: 'itemName', title: 'Item' },
            { key: 'totalQuantity', title: 'Total Qty' },
            {
              key: 'warehouses',
              title: 'Warehouse Breakdown',
              render: (group) =>
                Object.entries(group.warehouses)
                  .map(([warehouseName, quantity]) => `${warehouseName}: ${quantity}`)
                  .join(' | '),
            },
          ]}
          onRowPress={(group) =>
            setDetailModal({
              title: `${group.itemName} Details`,
              details: { item: group.itemName, totalQuantity: group.totalQuantity, ...group.warehouses },
            })
          }
        />
        <RecordList
          title="Stock Entries"
          data={stock}
          columns={[
            { key: 'item', title: 'Item', render: (entry) => entry?.item?.name || '-' },
            { key: 'warehouse', title: 'Warehouse', render: (entry) => entry?.warehouse?.name || '-' },
            { key: 'quantity', title: 'Quantity' },
            { key: 'updatedAt', title: 'Updated' },
          ]}
          onRowPress={(entry) =>
            setDetailModal({
              title: 'Stock Entry Details',
              details: entry,
              deleteAction: canManageItems ? { type: 'stock', id: entry._id, label: 'Delete Stock Entry' } : null,
            })
          }
        />
      </Section>

      {/* Item edit modal */}
      {editingItem && (
        <Modal title={`Edit Item: ${editingItem.name}`} onClose={closeItemEdit}>
          <label className="field-label">Item Name</label>
          <input className="input" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item name" />
          <label className="field-label">Tags</label>
          <input className="input" value={itemTags} onChange={(e) => setItemTags(e.target.value)} placeholder="Tags (comma separated)" />
          <label className="field-label">Manufacturing Price</label>
          <input className="input" value={manufacturingPrice} onChange={(e) => setManufacturingPrice(e.target.value)} placeholder="Manufacturing price" type="number" />
          <label className="field-label">Selling Price</label>
          <input className="input" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="Selling price" type="number" />
          {itemModalError ? <div className="meta-text" style={{ color: 'var(--danger)' }}>{itemModalError}</div> : null}
          <div className="actions-row">
            <button className="btn" onClick={saveItemEdit}>Save Changes</button>
            <button className="btn ghost" onClick={closeItemEdit}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Detail/delete modal */}
      {detailModal && (
        <RecordDetailModal
          title={detailModal.title}
          details={detailModal.details}
          onClose={() => setDetailModal(null)}
          onDelete={
            detailModal.deleteAction?.type === 'stock'
              ? async () => {
                  await api.deleteStock(token, detailModal.deleteAction.id);
                  await refreshAll();
                }
              : undefined
          }
          deleteLabel={detailModal.deleteAction?.label}
        />
      )}
    </Screen>
  );
}
