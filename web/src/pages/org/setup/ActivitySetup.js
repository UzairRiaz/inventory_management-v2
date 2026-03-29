import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../api';
import { useAuth } from '../../../auth/AuthContext';
import { RecordList, Screen, Section } from '../../../components/ui';

export default function ActivitySetup() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const canViewActivity = ['admin', 'manager'].includes(user.role);

  const loadLogs = useCallback(async () => {
    try {
      const data = await api.getActivity(token);
      setLogs(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <Screen>
      <Section title="Activity Log" icon="ACT">
        {canViewActivity ? (
          <RecordList
            title="Recent Actions"
            data={logs}
            columns={[
              { key: 'createdAt', title: 'Time' },
              { key: 'actorRole', title: 'Role' },
              { key: 'actionType', title: 'Action' },
              { key: 'resourceType', title: 'Resource' },
            ]}
            onRowPress={(item) =>
              navigate('/org/detail', {
                state: {
                  title: 'Activity Details',
                  details: item,
                },
              })
            }
          />
        ) : (
          <div className="meta-text">Only admin/manager can access activity logs.</div>
        )}
        {error ? <div className="meta-text">{error}</div> : null}
      </Section>
    </Screen>
  );
}
