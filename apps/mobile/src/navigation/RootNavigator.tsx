import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Import navigators
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import RegistrationNavigator from './RegistrationNavigator';

// Define the root stack param list
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Registration: undefined;
};

// Create the root stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { user, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <NavigationContainer>
        {/* You can create a LoadingScreen component for this */}
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={() => <LoadingScreen />} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is signed in
        user.profileComplete ? (
          // User has completed registration
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          // User needs to complete registration
          <Stack.Screen name="Registration" component={RegistrationNavigator} />
        )
      ) : (
        // User is not signed in
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

// Simple loading screen component
const LoadingScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#6200ee" />
    </View>
  );
};

export default RootNavigator;