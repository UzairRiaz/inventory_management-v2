import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api';
import { useAuth } from '../../../auth/AuthContext';
import { RecordList, Screen, Section } from '../../../components/ui';

export default function UsersSetup() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const canCreateUsers = user.role === 'admin';

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.getUsers(token);
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const createUser = async () => {
    try {
      await api.createUser(token, { name, email, password, role });
      setName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <Screen>
      <Section title="Organization Users" icon="USR">
        {canCreateUsers ? (
          <>
            <label className="field-label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <label className="field-label">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <label className="field-label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <label className="field-label">Role</label>
            <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (staff/manager)" />
            <div className="actions-row">
              <button className="btn" onClick={createUser}>Create User</button>
            </div>
          </>
        ) : (
          <div className="meta-text">Only admins can create users.</div>
        )}
        {error ? <div className="meta-text">{error}</div> : null}
        <RecordList
          title="Users"
          data={users}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'email', title: 'Email' },
            { key: 'role', title: 'Role' },
          ]}
          onRowPress={(item) =>
            navigate('/org/detail', {
              state: {
                title: 'User Details',
                details: item,
              },
            })
          }
        />
      </Section>
    </Screen>
  );
}
