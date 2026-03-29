import React, { useState } from 'react';
import { Alert, Button, Text, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { Screen, Section, styles } from '../../components/ui';

export default function OrgLoginScreen() {
  const { signIn } = useAuth();
  const [organizationCode, setOrganizationCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    try {
      setBusy(true);
      const data = await api.organizationLogin({ organizationCode, email, password });
      await signIn(data.token, data.user);
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Section title="Organization Login" icon="business-outline">
        <Text style={styles.fieldLabel}>Organization Code</Text>
        <TextInput
          style={styles.input}
          value={organizationCode}
          onChangeText={setOrganizationCode}
          placeholder="Organization code"
          autoCapitalize="characters"
        />
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <Button title={busy ? 'Logging in...' : 'Login'} onPress={onSubmit} disabled={busy} color="#0f766e" />
      </Section>
    </Screen>
  );
}
