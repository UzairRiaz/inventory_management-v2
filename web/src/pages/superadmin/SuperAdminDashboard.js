import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { RecordDetailModal, RecordList, Screen, Section } from '../../components/ui';

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState('');
  const [detailModal, setDetailModal] = useState(null);

  const loadOrganizations = useCallback(async () => {
    try {
      const data = await api.getOrganizations(token);
      setOrganizations(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const createOrganizationWithAdmin = async () => {
    try {
      setError('');
      await api.createOrganizationWithAdmin(token, {
        organizationName: orgName,
        organizationCode: orgCode,
        adminName,
        adminEmail,
        adminPassword,
      });
      setOrgName('');
      setOrgCode('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      await loadOrganizations();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  return (
    <Screen>
      <Section title="Super Admin Dashboard" icon="SA">
        <label className="field-label">Organization Name</label>
        <input className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name" />
        <label className="field-label">Organization Code</label>
        <input className="input" value={orgCode} onChange={(e) => setOrgCode(e.target.value)} placeholder="Organization code" />
        <label className="field-label">Admin Name</label>
        <input className="input" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Admin name" />
        <label className="field-label">Admin Email</label>
        <input className="input" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Admin email" />
        <label className="field-label">Admin Password</label>
        <input className="input" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Admin password" />
        {error ? <div className="meta-text">{error}</div> : null}
        <div className="actions-row">
          <button className="btn" onClick={createOrganizationWithAdmin}>Create Organization + Admin</button>
        </div>
        <RecordList
          title="Organizations"
          data={organizations}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'code', title: 'Code' },
          ]}
          onRowPress={(item) => setDetailModal({ title: 'Organization Details', details: item })}
        />
      </Section>

      {detailModal && (
        <RecordDetailModal
          title={detailModal.title}
          details={detailModal.details}
          onClose={() => setDetailModal(null)}
        />
      )}
    </Screen>
  );
}
