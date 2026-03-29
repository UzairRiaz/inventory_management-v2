import React, { useState } from 'react';
import { Alert, Button, Text, TextInput } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { Screen, Section, styles } from '../../components/ui';

export default function SuperAdminLoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    try {
      setBusy(true);
      const data = await api.superadminLogin({ email, password });
      await signIn(data.token, data.user);
    } catch (error) {
      Alert.alert('Login failed', error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Section title="Super Admin Login" icon="shield-checkmark-outline">
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <Button title={busy ? 'Logging in...' : 'Login'} onPress={onSubmit} disabled={busy} color="#4f46e5" />
      </Section>
    </Screen>
  );
}
