import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import SetupNavigator from './SetupNavigator';
import InventoryNavigator from './InventoryNavigator';
import SalesNavigator from './SalesNavigator';
import PaymentsNavigator from './PaymentsNavigator';
import LedgerNavigator from './LedgerNavigator';

const Tab = createBottomTabNavigator();

export default function OrgTabsNavigator() {
  const getTabIcon = (routeName, focused) => {
    const iconMap = {
      Home: focused ? 'home' : 'home-outline',
      Setup: focused ? 'settings' : 'settings-outline',
      Inventory: focused ? 'cube' : 'cube-outline',
      Sales: focused ? 'cart' : 'cart-outline',
      Payments: focused ? 'cash' : 'cash-outline',
      Ledger: focused ? 'book' : 'book-outline',
    };

    return iconMap[routeName] || 'ellipse-outline';
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={getTabIcon(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Inventory" component={InventoryNavigator} options={{ title: 'Inventory' }} />
      <Tab.Screen name="Sales" component={SalesNavigator} options={{ title: 'Sales' }} />
      <Tab.Screen name="Payments" component={PaymentsNavigator} options={{ title: 'Payments' }} />
      <Tab.Screen name="Ledger" component={LedgerNavigator} options={{ title: 'Ledger' }} />
      <Tab.Screen name="Setup" component={SetupNavigator} options={{ title: 'Setup' }} />
    </Tab.Navigator>
  );
}
