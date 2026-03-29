import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Section } from '../../components/ui';

export default function LoginChoice() {
  const navigate = useNavigate();

  return (
    <Screen>
      <Section title="Login" icon="LOG">
        <div className="actions-row">
          <button className="btn" onClick={() => navigate('/login/superadmin')}>
            Super Admin Login
          </button>
          <button className="btn secondary" onClick={() => navigate('/login/org')}>
            Organization Login
          </button>
        </div>
      </Section>
    </Screen>
  );
}
