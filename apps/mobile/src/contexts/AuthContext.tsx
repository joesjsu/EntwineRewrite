import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApolloClient, ApolloError } from '@apollo/client';
import { getApolloClient } from '../services/api/apolloClient';

// Define the User type
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileComplete?: boolean;
  registrationStep?: number;
  role?: string;
}

// Define the login credentials type
interface LoginCredentials {
  phoneNumber: string;
  password: string;
}

// Define the auth context type
interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  attemptRefreshToken: () => Promise<boolean>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define storage keys
const ACCESS_TOKEN_KEY = 'entwine_access_token';
const REFRESH_TOKEN_KEY = 'entwine_refresh_token';

// Define props for the provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [client, setClient] = useState<ApolloClient<any> | null>(null);

  // Initialize Apollo client
  useEffect(() => {
    const initClient = async () => {
      const apolloClient = await getApolloClient();
      setClient(apolloClient);
    };
    
    initClient();
  }, []);

  // Function to handle setting auth state
  const setAuthState = async (access: string, refresh: string, userData: User) => {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(userData);
    } catch (error) {
      console.error('Error storing auth tokens:', error);
    }
  };

  // Login function
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    if (!client) return false;
    
    setIsLoading(true);
    try {
      // This is a placeholder for the actual login mutation
      // In a real implementation, you would use the Apollo client to call the login mutation
      const result = await client.mutate({
        mutation: /* LOGIN_MUTATION would be imported from a graphql file */,
        variables: { input: credentials }
      });
      
      const data = result.data?.login;
      
      if (data?.accessToken && data?.refreshToken && data?.user) {
        await setAuthState(data.accessToken, data.refreshToken, data.user);
        console.log('Login successful');
        setIsLoading(false);
        return true;
      } else {
        throw new Error('Login response missing expected data.');
      }
    } catch (error) {
      console.error('Login failed:', error instanceof ApolloError ? error.message : error);
      await logout();
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    if (!client) return;
    
    setIsLoading(true);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await client.resetStore();
      console.log('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to attempt token refresh
  const attemptRefreshToken = async (): Promise<boolean> => {
    if (!client) return false;
    
    try {
      const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (!storedRefreshToken) {
        console.log('No refresh token found');
        await logout();
        return false;
      }
      
      // This is a placeholder for the actual refresh token mutation
      const result = await client.mutate({
        mutation: /* REFRESH_TOKEN_MUTATION would be imported from a graphql file */,
        variables: { refreshToken: storedRefreshToken }
      });
      
      const refreshData = result.data?.refreshToken;
      
      if (refreshData?.accessToken) {
        const newAccessToken = refreshData.accessToken;
        const newRefreshToken = refreshData.refreshToken || storedRefreshToken;
        
        // Fetch user data with the new token
        const userData = await client.query({
          query: /* ME_QUERY would be imported from a graphql file */,
          context: { headers: { authorization: `Bearer ${newAccessToken}` } },
          fetchPolicy: 'network-only'
        });
        
        if (userData?.data?.me) {
          await setAuthState(newAccessToken, newRefreshToken, userData.data.me);
          console.log('Token refresh successful');
          return true;
        } else {
          throw new Error('Failed to fetch user data after token refresh');
        }
      } else {
        throw new Error('Refresh token response missing expected data');
      }
    } catch (error) {
      console.error('Token refresh failed:', error instanceof ApolloError ? error.message : error);
      await logout();
      return false;
    }
  };

  // Effect to check initial authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!client) return;
      
      setIsLoading(true);
      try {
        const storedAccessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (storedAccessToken && storedRefreshToken) {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          
          try {
            // Validate access token by fetching user data
            const result = await client.query({
              query: /* ME_QUERY would be imported from a graphql file */,
              fetchPolicy: 'network-only'
            });
            
            if (result?.data?.me) {
              setUser(result.data.me);
              console.log('Initial auth check: Access token valid');
            } else {
              console.warn('Initial auth check: ME_QUERY succeeded but no user data returned');
              await logout();
            }
          } catch (error) {
            console.warn('Initial auth check failed (likely expired token):', error);
            // Access token failed, try refreshing
            const refreshed = await attemptRefreshToken();
            if (!refreshed) {
              console.log('Initial auth check: Refresh failed');
              // logout() is called within attemptRefreshToken on failure
            } else {
              console.log('Initial auth check: Refresh successful');
            }
          }
        } else {
          console.log('No tokens found in storage');
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };
    
    if (client) {
      checkAuthStatus();
    }
  }, [client]);

  // Provide the auth context
  const value = {
    accessToken,
    refreshToken,
    user,
    isLoading,
    login,
    logout,
    attemptRefreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};