import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api';
import { useAuth } from '../../../auth/AuthContext';
import { RecordList, Screen, Section } from '../../../components/ui';

export default function WarehouseSetup() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseLocation, setWarehouseLocation] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState('');
  const canManageWarehouse = ['admin', 'manager'].includes(user.role);

  const loadWarehouses = useCallback(async () => {
    try {
      const data = await api.getWarehouses(token);
      setWarehouses(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const createWarehouse = async () => {
    try {
      await api.createWarehouse(token, { name: warehouseName, location: warehouseLocation });
      setWarehouseName('');
      setWarehouseLocation('');
      await loadWarehouses();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  return (
    <Screen>
      <Section title="Warehouse Management" icon="WH">
        {canManageWarehouse ? (
          <>
            <label className="field-label">Warehouse Name</label>
            <input className="input" value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} placeholder="Warehouse name" />
            <label className="field-label">Warehouse Location</label>
            <input className="input" value={warehouseLocation} onChange={(e) => setWarehouseLocation(e.target.value)} placeholder="Warehouse location" />
            <div className="actions-row">
              <button className="btn" onClick={createWarehouse}>Create Warehouse</button>
            </div>
          </>
        ) : (
          <div className="meta-text">Only admin/manager can create warehouses.</div>
        )}
        {error ? <div className="meta-text">{error}</div> : null}
        <RecordList
          title="Warehouses"
          data={warehouses}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'location', title: 'Location', render: (item) => item.location || '-' },
          ]}
          onRowPress={(item) =>
            navigate('/org/detail', {
              state: {
                title: 'Warehouse Details',
                details: item,
              },
            })
          }
        />
      </Section>
    </Screen>
  );
}
