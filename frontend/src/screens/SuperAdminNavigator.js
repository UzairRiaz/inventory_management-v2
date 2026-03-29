import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SuperAdminDashboardScreen from './SuperAdminDashboardScreen';
import RowDetailScreen from './RowDetailScreen';

const Stack = createNativeStackNavigator();

export default function SuperAdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4f46e5' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="SuperAdminHome" component={SuperAdminDashboardScreen} options={{ title: 'Super Admin Dashboard' }} />
      <Stack.Screen name="RowDetail" component={RowDetailScreen} options={{ title: 'Row Details' }} />
    </Stack.Navigator>
  );
}
