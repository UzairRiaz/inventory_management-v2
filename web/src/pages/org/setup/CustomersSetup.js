import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api';
import { useAuth } from '../../../auth/AuthContext';
import { RecordList, Screen, Section } from '../../../components/ui';

export default function CustomersSetup() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [error, setError] = useState('');

  const canManageCustomers = ['admin', 'manager'].includes(user.role);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await api.getCustomers(token);
      setCustomers(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const createCustomer = async () => {
    try {
      if (!name) {
        setError('Customer name is required');
        return;
      }

      await api.createCustomer(token, { name, phone, email, address, openingBalance: Number(openingBalance || 0) });
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setOpeningBalance('');
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <Screen>
      <Section title="Customers" icon="CST">
        {canManageCustomers ? (
          <>
            <label className="field-label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
            <label className="field-label">Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            <label className="field-label">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <label className="field-label">Address</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
            <label className="field-label">Initial Outstanding</label>
            <input
              className="input"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="Opening balance"
            />
            <div className="actions-row">
              <button className="btn" onClick={createCustomer}>Create Customer</button>
            </div>
          </>
        ) : (
          <div className="meta-text">Only admin/manager can create customers.</div>
        )}
        {error ? <div className="meta-text">{error}</div> : null}
        <RecordList
          title="Customer List"
          data={customers}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'phone', title: 'Phone' },
            { key: 'email', title: 'Email' },
            { key: 'openingBalance', title: 'Outstanding' },
          ]}
          onRowPress={(item) =>
            navigate('/org/detail', {
              state: {
                title: 'Customer Details',
                details: item,
              },
            })
          }
        />
      </Section>
    </Screen>
  );
}
