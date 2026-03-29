import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { Provider } from 'react-redux';
import { useAuth, useInitializeAuth } from './src/context/AuthContext';
import { store } from './src/store';
import LoginChoiceScreen from './src/screens/auth/LoginChoiceScreen';
import SuperAdminLoginScreen from './src/screens/auth/SuperAdminLoginScreen';
import OrgLoginScreen from './src/screens/auth/OrgLoginScreen';
import SuperAdminNavigator from './src/screens/SuperAdminNavigator';
import OrgTabsNavigator from './src/screens/org/OrgTabsNavigator';
import { styles } from './src/components/ui';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4f46e5' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="LoginChoice" component={LoginChoiceScreen} options={{ title: 'Welcome' }} />
      <Stack.Screen name="SuperAdminLogin" component={SuperAdminLoginScreen} options={{ title: 'Super Admin Login' }} />
      <Stack.Screen name="OrgLogin" component={OrgLoginScreen} options={{ title: 'Organization Login' }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  useInitializeAuth();
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.content}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!token) {
    return <AuthStack />;
  }

  if (user?.role === 'superadmin') {
    return <SuperAdminNavigator />;
  }

  return <OrgTabsNavigator />;
}

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
}
