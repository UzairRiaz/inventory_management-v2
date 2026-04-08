import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Section } from '../../../components/ui';

export default function SetupHome() {
  const navigate = useNavigate();

  return (
    <Screen>
      <Section title="Setup" icon="SET">
        <div className="actions-row">
          <button className="btn" onClick={() => navigate('/org/setup/warehouses')}>Warehouse Management</button>
          <button className="btn" onClick={() => navigate('/org/setup/items')}>Item Management</button>
          <button className="btn" onClick={() => navigate('/org/setup/customers')}>Customers</button>
          <button className="btn" onClick={() => navigate('/org/setup/users')}>Users</button>
          <button className="btn secondary" onClick={() => navigate('/org/ledger')}>Ledger</button>
          <button className="btn secondary" onClick={() => navigate('/org/setup/notes')}>Notes</button>
          <button className="btn warning" onClick={() => navigate('/org/setup/profit')}>Profit</button>
          <button className="btn ghost" onClick={() => navigate('/org/setup/activity')}>Activity Log</button>
        </div>
      </Section>
    </Screen>
  );
}
