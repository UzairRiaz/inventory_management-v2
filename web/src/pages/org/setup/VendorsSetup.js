import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api';
import { useAuth } from '../../../auth/AuthContext';
import { Modal, PageHeader, RecordList, Screen, Section } from '../../../components/ui';

export default function VendorsSetup() {
  const { token, user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [editingVendor, setEditingVendor] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');

  const canManage = ['admin', 'manager'].includes(user.role);

  const loadVendors = useCallback(async () => {
    try {
      const data = await api.getVendors(token);
      setVendors(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const openEdit = (vendor) => {
    setEditingVendor(vendor);
    setName(vendor.name || '');
    setPhone(vendor.phone || '');
    setEmail(vendor.email || '');
    setAddress(vendor.address || '');
    setModalError('');
  };

  const closeModal = () => {
    setEditingVendor(null);
    setModalError('');
  };

  const createVendor = async () => {
    try {
      if (!createName) {
        setError('Vendor name is required');
        return;
      }
      await api.createVendor(token, {
        name: createName,
        phone: createPhone,
        email: createEmail,
        address: createAddress,
      });
      setCreateName('');
      setCreatePhone('');
      setCreateEmail('');
      setCreateAddress('');
      setError('');
      await loadVendors();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveEdit = async () => {
    try {
      if (!name) {
        setModalError('Vendor name is required');
        return;
      }
      await api.updateVendor(token, editingVendor._id, { name, phone, email, address });
      closeModal();
      await loadVendors();
    } catch (err) {
      setModalError(err.message);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  return (
    <Screen>
      <PageHeader title="Manage Vendors" backTo="/org/setup" />
      <Section title="Vendors" icon="CST">
        {canManage ? (
          <>
            <label className="field-label">Name</label>
            <input className="input" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Vendor name" />
            <label className="field-label">Phone</label>
            <input className="input" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} placeholder="Phone" />
            <label className="field-label">Email</label>
            <input className="input" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="Email" />
            <label className="field-label">Address</label>
            <input className="input" value={createAddress} onChange={(e) => setCreateAddress(e.target.value)} placeholder="Address" />
            <div className="actions-row">
              <button type="button" className="btn" onClick={createVendor}>Create Vendor</button>
            </div>
          </>
        ) : (
          <div className="meta-text">Only admin/manager can manage vendors.</div>
        )}
        {error ? <div className="meta-text">{error}</div> : null}
        <RecordList
          title="Vendor List"
          data={vendors}
          mobileLayout="cards"
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'phone', title: 'Phone' },
            { key: 'email', title: 'Email' },
          ]}
          onRowPress={(item) => openEdit(item)}
        />
      </Section>

      {editingVendor && (
        <Modal title={`Edit Vendor: ${editingVendor.name}`} onClose={closeModal}>
          <label className="field-label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vendor name" />
          <label className="field-label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          <label className="field-label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <label className="field-label">Address</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
          {modalError ? <div className="meta-text" style={{ color: 'var(--danger)' }}>{modalError}</div> : null}
          <div className="actions-row">
            <button type="button" className="btn" onClick={saveEdit}>Save Changes</button>
            <button type="button" className="btn ghost" onClick={closeModal}>Cancel</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}
