import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Screen, Section, Select } from '../../components/ui';

export default function InventoryCreate() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [adjustType, setAdjustType] = useState('IN');
  const [error, setError] = useState('');

  const loadOptions = async () => {
    try {
      const [warehouseData, itemData] = await Promise.all([api.getWarehouses(token), api.getItems(token)]);
      setWarehouses(warehouseData);
      setItems(itemData);
      if (!warehouseId && warehouseData[0]?._id) setWarehouseId(warehouseData[0]._id);
      if (!itemId && itemData[0]?._id) setItemId(itemData[0]._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!warehouseId || !itemId) {
        setError('Please select warehouse and item');
        return;
      }

      if (user.role === 'staff') {
        await api.createNote(token, {
          type: 'debit',
          customerName: 'INTERNAL',
          amount: 0,
          description: `Adjustment request by ${user.name}: ${adjustType} ${quantity} for item ${itemId} in warehouse ${warehouseId}`,
          linkedTransactionId: `stock-request-${Date.now()}`,
        });
        navigate('/org/inventory');
        return;
      }

      await api.adjustStock(token, {
        warehouseId,
        itemId,
        quantity: Number(quantity || 0),
        type: adjustType,
      });

      navigate('/org/inventory');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  return (
    <Screen>
      <Section title={user.role === 'staff' ? 'Request Inventory Adjustment' : 'Adjust Inventory'} icon="NEW">
        <form onSubmit={onSubmit}>
          <div className="field-label">Warehouse</div>
          <Select
            value={warehouseId}
            onChange={setWarehouseId}
            placeholder="Select warehouse"
            items={warehouses.map((warehouse) => ({ label: warehouse.name, value: warehouse._id }))}
          />

          <div className="field-label">Item</div>
          <Select
            value={itemId}
            onChange={setItemId}
            placeholder="Select item"
            items={items.map((item) => ({ label: item.name, value: item._id }))}
          />

          <label className="field-label">Quantity</label>
          <input className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" />

          <label className="field-label">Adjustment Type</label>
          <input className="input" value={adjustType} onChange={(e) => setAdjustType(e.target.value)} placeholder="IN or OUT" />

          {error ? <div className="meta-text">{error}</div> : null}

          <div className="actions-row">
            <button className="btn" type="submit">
              {user.role === 'staff' ? 'Request Adjustment' : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </Section>
    </Screen>
  );
}
