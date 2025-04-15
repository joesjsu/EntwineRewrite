import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens (to be created later)
// import HomeScreen from '../screens/home/HomeScreen';
// import ChatScreen from '../screens/chat/ChatScreen';
// import ProfileScreen from '../screens/profile/ProfileScreen';

// Define the main tab param list
export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Profile: undefined;
};

// Create the main tab navigator
const Tab = createBottomTabNavigator<MainTabParamList>();

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

const HomeScreen = () => <PlaceholderScreen title="Home/Matches Screen" />;
const ChatScreen = () => <PlaceholderScreen title="Chat Screen" />;
const ProfileScreen = () => <PlaceholderScreen title="Profile Screen" />;

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

const MainNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => (
            <Icon name="heart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Icon name="chat" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;