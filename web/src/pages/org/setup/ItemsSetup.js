import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api';
import { useAuth } from '../../../auth/AuthContext';
import { RecordList, Screen, Section } from '../../../components/ui';

export default function ItemsSetup() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemTags, setItemTags] = useState('');
  const [manufacturingPrice, setManufacturingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [error, setError] = useState('');
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

  const createItem = async () => {
    try {
      await api.createItem(token, {
        name: itemName,
        tags: itemTags,
        manufacturingPrice: Number(manufacturingPrice || 0),
        sellingPrice: Number(sellingPrice || 0),
      });
      setItemName('');
      setItemTags('');
      setManufacturingPrice('');
      setSellingPrice('');
      await loadItems();
    } catch (err) {
      setError(err.message);
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
            <input className="input" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item name" />
            <label className="field-label">Tags</label>
            <input className="input" value={itemTags} onChange={(e) => setItemTags(e.target.value)} placeholder="Tags (comma separated)" />
            <label className="field-label">Manufacturing Price</label>
            <input className="input" value={manufacturingPrice} onChange={(e) => setManufacturingPrice(e.target.value)} placeholder="Manufacturing price" />
            <label className="field-label">Selling Price</label>
            <input className="input" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="Selling price" />
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
          onRowPress={(item) =>
            navigate('/org/detail', {
              state: {
                title: 'Item Details',
                details: item,
              },
            })
          }
        />
      </Section>
    </Screen>
  );
}
