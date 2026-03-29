import React, { useCallback, useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { RecordList, Screen, Section, styles } from '../components/ui';

export default function SuperAdminDashboardScreen({ navigation }) {
  const { token, signOut } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [organizations, setOrganizations] = useState([]);

  const loadOrganizations = useCallback(async () => {
    try {
      const data = await api.getOrganizations(token);
      setOrganizations(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }, [token]);

  const createOrganizationWithAdmin = async () => {
    try {
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
      Alert.alert('Success', 'Organization and admin created');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrganizations();
    }, [loadOrganizations]),
  );

  return (
    <Screen>
      <Section title="Super Admin Dashboard" icon="speedometer-outline">
        <Text style={styles.fieldLabel}>Organization Name</Text>
        <TextInput style={styles.input} value={orgName} onChangeText={setOrgName} placeholder="Organization name" />
        <Text style={styles.fieldLabel}>Organization Code</Text>
        <TextInput style={styles.input} value={orgCode} onChangeText={setOrgCode} placeholder="Organization code" autoCapitalize="characters" />
        <Text style={styles.fieldLabel}>Admin Name</Text>
        <TextInput style={styles.input} value={adminName} onChangeText={setAdminName} placeholder="Admin name" />
        <Text style={styles.fieldLabel}>Admin Email</Text>
        <TextInput style={styles.input} value={adminEmail} onChangeText={setAdminEmail} placeholder="Admin email" autoCapitalize="none" />
        <Text style={styles.fieldLabel}>Admin Password</Text>
        <TextInput style={styles.input} value={adminPassword} onChangeText={setAdminPassword} placeholder="Admin password" secureTextEntry />
        <Button title="Create Organization + Admin" onPress={createOrganizationWithAdmin} color="#4f46e5" />
        <View style={styles.spacer} />
        <RecordList
          title="Organizations"
          data={organizations}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'code', title: 'Code' },
          ]}
          onRowPress={(item) =>
            navigation.navigate('RowDetail', {
              title: 'Organization Details',
              details: item,
            })
          }
        />
        <Button title="Logout" onPress={signOut} color="#b91c1c" />
      </Section>
    </Screen>
  );
}
