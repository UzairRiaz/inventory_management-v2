import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PaymentsScreen from './PaymentsScreen';
import PaymentsCreateScreen from './PaymentsCreateScreen';
import { HeaderAddButton } from '../../components/ui';
import RowDetailScreen from '../RowDetailScreen';
import CustomerSalesScreen from './CustomerSalesScreen';

const Stack = createNativeStackNavigator();

export default function PaymentsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4f46e5' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="PaymentsHome"
        component={PaymentsScreen}
        options={({ navigation }) => ({
          title: 'Payments',
          headerRight: () => <HeaderAddButton onPress={() => navigation.navigate('PaymentsCreate')} />,
        })}
      />
      <Stack.Screen name="PaymentsCreate" component={PaymentsCreateScreen} options={{ title: 'Receive Payment' }} />
      <Stack.Screen name="CustomerSales" component={CustomerSalesScreen} options={{ title: 'Customer Sales' }} />
      <Stack.Screen name="RowDetail" component={RowDetailScreen} options={{ title: 'Row Details' }} />
    </Stack.Navigator>
  );
}
