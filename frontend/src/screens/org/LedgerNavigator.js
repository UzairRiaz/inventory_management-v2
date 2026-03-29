import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LedgerScreen from './LedgerScreen';
import LedgerCreateScreen from './LedgerCreateScreen';
import { HeaderAddButton } from '../../components/ui';
import RowDetailScreen from '../RowDetailScreen';

const Stack = createNativeStackNavigator();

export default function LedgerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4f46e5' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="LedgerHome"
        component={LedgerScreen}
        options={({ navigation }) => ({
          title: 'Ledger',
          headerRight: () => <HeaderAddButton onPress={() => navigation.navigate('LedgerCreate')} />,
        })}
      />
      <Stack.Screen name="LedgerCreate" component={LedgerCreateScreen} options={{ title: 'New Ledger Entry' }} />
      <Stack.Screen name="RowDetail" component={RowDetailScreen} options={{ title: 'Row Details' }} />
    </Stack.Navigator>
  );
}
