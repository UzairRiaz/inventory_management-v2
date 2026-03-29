import React, { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../api';
import { RecordList, Screen, Section, styles } from '../../../components/ui';

export default function ActivitySetupScreen({ navigation }) {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState([]);
  const canViewActivity = ['admin', 'manager'].includes(user.role);

  const loadLogs = useCallback(async () => {
    try {
      const data = await api.getActivity(token);
      setLogs(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [loadLogs]),
  );

  return (
    <Screen>
      <Section title="Activity Log" icon="document-text-outline">
        {canViewActivity ? (
          <>
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
                navigation.navigate('RowDetail', {
                  title: 'Activity Details',
                  details: item,
                })
              }
            />
          </>
        ) : (
          <Text style={styles.metaText}>Only admin/manager can access activity logs.</Text>
        )}
      </Section>
    </Screen>
  );
}
