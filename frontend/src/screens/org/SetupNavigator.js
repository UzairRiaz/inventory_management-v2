import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SetupHomeScreen from './setup/SetupHomeScreen';
import WarehouseSetupScreen from './setup/WarehouseSetupScreen';
import ItemsSetupScreen from './setup/ItemsSetupScreen';
import NotesSetupScreen from './setup/NotesSetupScreen';
import UsersSetupScreen from './setup/UsersSetupScreen';
import ActivitySetupScreen from './setup/ActivitySetupScreen';
import CustomersSetupScreen from './setup/CustomersSetupScreen';
import ProfitScreen from './ProfitScreen';
import RowDetailScreen from '../RowDetailScreen';

const Stack = createNativeStackNavigator();

export default function SetupNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="SetupHome"
      screenOptions={{
        headerStyle: { backgroundColor: '#4f46e5' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="SetupHome" component={SetupHomeScreen} options={{ title: 'Setup' }} />
      <Stack.Screen name="WarehouseSetup" component={WarehouseSetupScreen} options={{ title: 'Warehouse Setup' }} />
      <Stack.Screen name="ItemsSetup" component={ItemsSetupScreen} options={{ title: 'Item Setup' }} />
      <Stack.Screen name="NotesSetup" component={NotesSetupScreen} options={{ title: 'Notes Setup' }} />
      <Stack.Screen name="UsersSetup" component={UsersSetupScreen} options={{ title: 'Users Setup' }} />
      <Stack.Screen name="CustomersSetup" component={CustomersSetupScreen} options={{ title: 'Customers Setup' }} />
      <Stack.Screen name="Profit" component={ProfitScreen} options={{ title: 'Profit' }} />
      <Stack.Screen name="ActivitySetup" component={ActivitySetupScreen} options={{ title: 'Activity Setup' }} />
      <Stack.Screen name="RowDetail" component={RowDetailScreen} options={{ title: 'Row Details' }} />
    </Stack.Navigator>
  );
}
