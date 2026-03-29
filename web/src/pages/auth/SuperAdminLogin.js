import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Screen, Section } from '../../components/ui';

export default function SuperAdminLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setBusy(true);
      setError('');
      const data = await api.superadminLogin({ email, password });
      await signIn(data.token, data.user);
      navigate('/superadmin');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Section title="Super Admin Login" icon="ADM">
        <form onSubmit={onSubmit}>
          <label className="field-label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <label className="field-label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          {error ? <div className="meta-text">{error}</div> : null}
          <div className="actions-row">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </Section>
    </Screen>
  );
}
