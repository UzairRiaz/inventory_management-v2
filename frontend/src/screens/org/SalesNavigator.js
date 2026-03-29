import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SalesScreen from './SalesScreen';
import SalesCreateScreen from './SalesCreateScreen';
import { HeaderAddButton } from '../../components/ui';
import RowDetailScreen from '../RowDetailScreen';

const Stack = createNativeStackNavigator();

export default function SalesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4f46e5' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="SalesHome"
        component={SalesScreen}
        options={({ navigation }) => ({
          title: 'Sales',
          headerRight: () => <HeaderAddButton onPress={() => navigation.navigate('SalesCreate')} />,
        })}
      />
      <Stack.Screen name="SalesCreate" component={SalesCreateScreen} options={{ title: 'New Sale' }} />
      <Stack.Screen name="RowDetail" component={RowDetailScreen} options={{ title: 'Row Details' }} />
    </Stack.Navigator>
  );
}
