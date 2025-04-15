import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import RootNavigator from './navigation/RootNavigator';
import { theme } from './theme/theme';

const App = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <AuthProvider>
              <SocketProvider>
                <RootNavigator />
              </SocketProvider>
            </AuthProvider>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;