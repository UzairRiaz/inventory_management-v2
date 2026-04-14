import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api';
import { useAuth } from '../../../auth/AuthContext';
import { Modal, RecordList, Screen, Section } from '../../../components/ui';

export default function CustomersSetup() {
  const { token, user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [createOpeningBalance, setCreateOpeningBalance] = useState('');
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');

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

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setName(customer.name || '');
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setAddress(customer.address || '');
    setOpeningBalance(customer.openingBalance != null ? String(customer.openingBalance) : '0');
    setModalError('');
  };

  const closeModal = () => {
    setEditingCustomer(null);
    setModalError('');
  };

  const createCustomer = async () => {
    try {
      if (!createName) {
        setError('Customer name is required');
        return;
      }
      await api.createCustomer(token, {
        name: createName,
        phone: createPhone,
        email: createEmail,
        address: createAddress,
        openingBalance: Number(createOpeningBalance || 0),
      });
      setCreateName('');
      setCreatePhone('');
      setCreateEmail('');
      setCreateAddress('');
      setCreateOpeningBalance('');
      setError('');
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveEdit = async () => {
    try {
      if (!name) {
        setModalError('Customer name is required');
        return;
      }
      await api.updateCustomer(token, editingCustomer._id, {
        name,
        phone,
        email,
        address,
        openingBalance: Number(openingBalance || 0),
      });
      closeModal();
      await loadCustomers();
    } catch (err) {
      setModalError(err.message);
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
            <input className="input" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Customer name" />
            <label className="field-label">Phone</label>
            <input className="input" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} placeholder="Phone" />
            <label className="field-label">Email</label>
            <input className="input" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="Email" />
            <label className="field-label">Address</label>
            <input className="input" value={createAddress} onChange={(e) => setCreateAddress(e.target.value)} placeholder="Address" />
            <label className="field-label">Initial Outstanding</label>
            <input
              className="input"
              value={createOpeningBalance}
              onChange={(e) => setCreateOpeningBalance(e.target.value)}
              placeholder="Opening balance"
              type="number"
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
          onRowPress={(item) => openEdit(item)}
        />
      </Section>

      {editingCustomer && (
        <Modal title={`Edit Customer: ${editingCustomer.name}`} onClose={closeModal}>
          <label className="field-label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
          <label className="field-label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          <label className="field-label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <label className="field-label">Address</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
          <label className="field-label">Outstanding Balance</label>
          <input
            className="input"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="Outstanding balance"
            type="number"
          />
          {modalError ? <div className="meta-text" style={{ color: 'var(--danger)' }}>{modalError}</div> : null}
          <div className="actions-row">
            <button className="btn" onClick={saveEdit}>Save Changes</button>
            <button className="btn ghost" onClick={closeModal}>Cancel</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}
