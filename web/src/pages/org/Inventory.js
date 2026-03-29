import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { RecordList, Screen, Section } from '../../components/ui';

export default function Inventory() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

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

  const stockByItem = Object.values(
    stock.reduce((groups, entry) => {
      const itemId = entry?.item?._id || String(entry?.item || 'unknown-item');
      const itemName = entry?.item?.name || 'Unknown Item';
      const warehouseName = entry?.warehouse?.name || String(entry?.warehouse || 'Unknown Warehouse');
      const quantity = Number(entry?.quantity || 0);

      if (!groups[itemId]) {
        groups[itemId] = {
          itemId,
          itemName,
          totalQuantity: 0,
          warehouses: {},
        };
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
          onRowPress={(item) =>
            navigate('/org/detail', {
              state: {
                title: 'Item Details',
                details: item,
              },
            })
          }
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
            navigate('/org/detail', {
              state: {
                title: `${group.itemName} Details`,
                details: {
                  item: group.itemName,
                  totalQuantity: group.totalQuantity,
                  ...group.warehouses,
                },
              },
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
            navigate('/org/detail', {
              state: {
                title: 'Stock Entry Details',
                details: entry,
                deleteAction:
                  ['admin', 'manager'].includes(user?.role)
                    ? {
                        type: 'stock',
                        id: entry._id,
                        label: 'Delete Stock Entry',
                      }
                    : null,
              },
            })
          }
        />
      </Section>
    </Screen>
  );
}
