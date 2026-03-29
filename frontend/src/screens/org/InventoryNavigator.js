import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InventoryScreen from './InventoryScreen';
import InventoryCreateScreen from './InventoryCreateScreen';
import { HeaderAddButton } from '../../components/ui';
import RowDetailScreen from '../RowDetailScreen';

const Stack = createNativeStackNavigator();

export default function InventoryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4f46e5' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="InventoryHome"
        component={InventoryScreen}
        options={({ navigation }) => ({
          title: 'Inventory',
          headerRight: () => (
            <HeaderAddButton onPress={() => navigation.navigate('InventoryCreate')} />
          ),
        })}
      />
      <Stack.Screen name="InventoryCreate" component={InventoryCreateScreen} options={{ title: 'New Inventory Entry' }} />
      <Stack.Screen name="RowDetail" component={RowDetailScreen} options={{ title: 'Row Details' }} />
    </Stack.Navigator>
  );
}
