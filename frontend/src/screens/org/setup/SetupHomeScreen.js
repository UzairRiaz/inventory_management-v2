import React from 'react';
import { Button, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { Screen, Section, styles } from '../../../components/ui';

export default function SetupHomeScreen({ navigation }) {
  const { signOut } = useAuth();

  return (
    <Screen>
      <Section title="Setup" icon="settings-outline">
        <Button title="Warehouse Management" onPress={() => navigation.navigate('WarehouseSetup')} color="#0284c7" />
        <View style={styles.spacer} />
        <Button title="Item Management" onPress={() => navigation.navigate('ItemsSetup')} color="#2563eb" />
        <View style={styles.spacer} />
        <Button title="Notes" onPress={() => navigation.navigate('NotesSetup')} color="#0f766e" />
        <View style={styles.spacer} />
        <Button title="Users" onPress={() => navigation.navigate('UsersSetup')} color="#4f46e5" />
        <View style={styles.spacer} />
        <Button title="Customers" onPress={() => navigation.navigate('CustomersSetup')} color="#1d4ed8" />
        <View style={styles.spacer} />
        <Button title="Profit" onPress={() => navigation.navigate('Profit')} color="#ea580c" />
        <View style={styles.spacer} />
        <Button title="Activity Log" onPress={() => navigation.navigate('ActivitySetup')} color="#334155" />
        <View style={styles.spacer} />
        <Button title="Logout" onPress={signOut} color="#b91c1c" />
      </Section>
    </Screen>
  );
}
