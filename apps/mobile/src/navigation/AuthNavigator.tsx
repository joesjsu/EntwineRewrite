import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens (to be created later)
// import LoginScreen from '../screens/auth/LoginScreen';
// import SignupScreen from '../screens/auth/SignupScreen';
// import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Define the auth stack param list
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

// Create the auth stack navigator
const Stack = createNativeStackNavigator<AuthStackParamList>();

// Placeholder components until we create the actual screens
const LoginScreen = () => <PlaceholderScreen title="Login Screen" />;
const SignupScreen = () => <PlaceholderScreen title="Signup Screen" />;
const ForgotPasswordScreen = () => <PlaceholderScreen title="Forgot Password Screen" />;

// Placeholder screen component
import { View, Text, StyleSheet } from 'react-native';

const PlaceholderScreen = ({ title }: { title: string }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{title}</Text>
      <Text style={styles.subText}>This is a placeholder. Implement the actual screen later.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#6200ee',
  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen} 
        options={{ title: 'Create Account' }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ title: 'Reset Password' }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;