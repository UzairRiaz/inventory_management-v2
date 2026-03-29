import React from 'react';
import { Button, View } from 'react-native';
import { Screen, Section, styles } from '../../components/ui';

export default function LoginChoiceScreen({ navigation }) {
  return (
    <Screen>
      <Section title="Login" icon="log-in-outline">
        <Button title="Super Admin Login" onPress={() => navigation.navigate('SuperAdminLogin')} color="#4f46e5" />
        <View style={styles.spacer} />
        <Button title="Organization Login" onPress={() => navigation.navigate('OrgLogin')} color="#0f766e" />
      </Section>
    </Screen>
  );
}
