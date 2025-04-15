import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Import screens (to be created later)
// import BasicProfileScreen from '../screens/registration/BasicProfileScreen';
// import DatingPreferencesScreen from '../screens/registration/DatingPreferencesScreen';
// import PhotoRatingScreen from '../screens/registration/PhotoRatingScreen';
// import AICoachChatScreen from '../screens/registration/AICoachChatScreen';
// import AIPersonaChatScreen from '../screens/registration/AIPersonaChatScreen';
// import RegistrationCompleteScreen from '../screens/registration/RegistrationCompleteScreen';

// Define the registration stack param list
export type RegistrationStackParamList = {
  BasicProfile: undefined;
  DatingPreferences: undefined;
  PhotoRating: undefined;
  AICoachChat: undefined;
  AIPersonaChat: undefined;
  RegistrationComplete: undefined;
};

// Create the registration stack navigator
const Stack = createNativeStackNavigator<RegistrationStackParamList>();

// Placeholder components until we create the actual screens
import { View, Text, StyleSheet } from 'react-native';

const PlaceholderScreen = ({ title }: { title: string }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{title}</Text>
      <Text style={styles.subText}>This is a placeholder. Implement the actual screen later.</Text>
    </View>
  );
};

const BasicProfileScreen = () => <PlaceholderScreen title="Basic Profile Screen" />;
const DatingPreferencesScreen = () => <PlaceholderScreen title="Dating Preferences Screen" />;
const PhotoRatingScreen = () => <PlaceholderScreen title="Photo Rating Screen" />;
const AICoachChatScreen = () => <PlaceholderScreen title="AI Coach Chat Screen" />;
const AIPersonaChatScreen = () => <PlaceholderScreen title="AI Persona Chat Screen" />;
const RegistrationCompleteScreen = () => <PlaceholderScreen title="Registration Complete Screen" />;

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

const RegistrationNavigator = () => {
  const { user } = useAuth();
  const registrationStep = user?.registrationStep || 1;

  // Determine the initial route based on the user's registration step
  const getInitialRouteName = () => {
    switch (registrationStep) {
      case 1:
        return 'BasicProfile';
      case 2:
        return 'DatingPreferences';
      case 3:
        return 'PhotoRating';
      case 4:
        return 'AICoachChat';
      case 5:
        return 'AIPersonaChat';
      case 6:
        return 'RegistrationComplete';
      default:
        return 'BasicProfile';
    }
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="BasicProfile"
        component={BasicProfileScreen}
        options={{ title: 'Your Profile' }}
      />
      <Stack.Screen
        name="DatingPreferences"
        component={DatingPreferencesScreen}
        options={{ title: 'Your Preferences' }}
      />
      <Stack.Screen
        name="PhotoRating"
        component={PhotoRatingScreen}
        options={{ title: 'Rate Photos' }}
      />
      <Stack.Screen
        name="AICoachChat"
        component={AICoachChatScreen}
        options={{ title: 'Chat with Coach' }}
      />
      <Stack.Screen
        name="AIPersonaChat"
        component={AIPersonaChatScreen}
        options={{ title: 'Chat with Personas' }}
      />
      <Stack.Screen
        name="RegistrationComplete"
        component={RegistrationCompleteScreen}
        options={{ title: 'All Done!', headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
};

export default RegistrationNavigator;