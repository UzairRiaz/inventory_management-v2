import React, { useCallback, useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../api';
import { RecordList, Screen, Section, styles } from '../../../components/ui';

export default function UsersSetupScreen({ navigation }) {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const canCreateUsers = user.role === 'admin';

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.getUsers(token);
      setUsers(data);
    } catch (error) {
      Alert.alert('Error', error.message);
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
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  return (
    <Screen>
      <Section title="Organization Users" icon="people-outline">
        {canCreateUsers ? (
          <>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            <Text style={styles.fieldLabel}>Role</Text>
            <TextInput style={styles.input} value={role} onChangeText={setRole} placeholder="Role (staff/manager)" autoCapitalize="none" />
            <Button title="Create User" onPress={createUser} color="#2563eb" />
            <View style={styles.spacer} />
          </>
        ) : (
          <Text style={styles.metaText}>Only admins can create users.</Text>
        )}

        <RecordList
          title="Users"
          data={users}
          columns={[
            { key: 'name', title: 'Name' },
            { key: 'email', title: 'Email' },
            { key: 'role', title: 'Role' },
          ]}
          onRowPress={(item) =>
            navigation.navigate('RowDetail', {
              title: 'User Details',
              details: item,
            })
          }
        />
      </Section>
    </Screen>
  );
}
