'use client';
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useMutation, useApolloClient, ApolloError } from '@apollo/client';
import { REFRESH_TOKEN_MUTATION } from '../graphql/mutations'; // LOGIN_MUTATION moved
import { LOGIN_MUTATION } from '../graphql/auth.gql'; // Remove .ts extension for module resolution
import { ME_QUERY } from '../graphql/queries';
import { UserRole } from '@/graphql/generated'; // Import UserRole type
import { authEvents, AUTH_EVENTS } from '../lib/authEvents';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>; // Returns true on success, false on failure
  logout: () => Promise<void>;
  attemptRefreshToken: () => Promise<boolean>; // Exposed for potential use in errorLink
}

// Define User type based on ME_QUERY
interface User {
  id: string;
  email: string;
  firstName?: string; // Changed from name
  lastName?: string;  // Added lastName
  profileComplete?: boolean;
  registrationStep?: number;
  role?: UserRole; // Add the role field
  // Add other fields from ME_QUERY as needed
}

// Define Login Credentials type
interface LoginCredentials {
  phoneNumber: string; // Changed from email
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Define keys for localStorage
const ACCESS_TOKEN_KEY = 'entwine_access_token';
const REFRESH_TOKEN_KEY = 'entwine_refresh_token';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true to check initial auth status
  const client = useApolloClient(); // Get Apollo Client instance

  // Define mutations
  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN_MUTATION);

  // Function to handle setting auth state after login/refresh
  const setAuthState = (access: string, refresh: string, userData: User) => {
    console.log(`AuthContext: Storing token under key '${ACCESS_TOKEN_KEY}'`); // Added log
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    setAccessToken(access);
    setRefreshToken(refresh);
    setUser(userData);
  };

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data } = await loginMutation({ variables: { input: credentials } }); // Wrap credentials in input object
      if (data?.login?.accessToken && data?.login?.refreshToken && data?.login?.user) {
        setAuthState(data.login.accessToken, data.login.refreshToken, data.login.user);
        console.log('Login successful');
        setIsLoading(false);
        return true;
      } else {
        throw new Error('Login response missing expected data.');
      }
    } catch (error) {
      console.error('Login failed:', error instanceof ApolloError ? error.message : error);
      // Clear any potentially partially set state on failure
      await logout(); // Use logout to ensure clean state
      setIsLoading(false);
      return false;
    }
  }, [loginMutation, client]); // Added client dependency for logout

  // Logout function
  const logout = useCallback(async () => {
    console.log('Logout function called');
    setIsLoading(true);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    try {
      // Reset Apollo cache to clear sensitive user data
      await client.resetStore();
      console.log('Apollo store reset.');
    } catch (error) {
      console.error('Error resetting Apollo store during logout:', error);
    }
    setIsLoading(false);
  }, [client]);

  // Function to attempt token refresh
  const attemptRefreshToken = useCallback(async (): Promise<boolean> => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) {
      console.log('No refresh token found for refresh attempt.');
      await logout(); // Ensure clean state if no refresh token
      return false;
    }

    console.log('Attempting token refresh...');
    try {
      const { data: refreshData } = await refreshTokenMutation({
        variables: { refreshToken: storedRefreshToken },
      });

      if (refreshData?.refreshToken?.accessToken) {
        const newAccessToken = refreshData.refreshToken.accessToken;
        // API might return a new refresh token, use it if available, otherwise keep the old one
        const newRefreshToken = refreshData.refreshToken.refreshToken || storedRefreshToken;

        // Fetch user data with the new access token
        const { data: userData } = await client.query({
          query: ME_QUERY,
          context: { headers: { authorization: `Bearer ${newAccessToken}` } }, // Use new token immediately
          fetchPolicy: 'network-only', // Ensure fresh data
        });

        if (userData?.me) {
          setAuthState(newAccessToken, newRefreshToken, userData.me);
          console.log('Token refresh successful.');
          return true;
        } else {
          throw new Error('Failed to fetch user data after token refresh.');
        }
      } else {
        throw new Error('Refresh token response missing expected data.');
      }
    } catch (error) {
      console.error('Token refresh failed:', error instanceof ApolloError ? error.message : error);
      await logout(); // Logout if refresh fails
      return false;
    }
  }, [refreshTokenMutation, client, logout]); // Added logout dependency

  // Effect to check initial authentication status on mount
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts during async ops

    const checkAuthStatus = async () => {
      setIsLoading(true);
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (storedAccessToken && storedRefreshToken) {
        console.log('Found tokens in storage, attempting validation...');
        setAccessToken(storedAccessToken); // Optimistically set
        setRefreshToken(storedRefreshToken); // Optimistically set

        try {
          // Validate access token by fetching user data
          const { data } = await client.query({
             query: ME_QUERY,
             fetchPolicy: 'network-only' // Don't use cache for validation
          });
          if (data?.me && isMounted) {
            setUser(data.me);
            console.log('Initial auth check: Access token valid, user fetched.');
          } else if (isMounted) {
             // This case shouldn't happen if query succeeds but data.me is null/undefined
             console.warn('Initial auth check: ME_QUERY succeeded but no user data returned.');
             await logout(); // Treat as failure
          }
        } catch (error) {
          console.warn('Initial auth check failed (likely expired token):', error instanceof ApolloError ? error.message : error);
          if (isMounted) {
            // Access token failed, try refreshing
            const refreshed = await attemptRefreshToken();
            if (!refreshed) {
              console.log('Initial auth check: Refresh failed, logging out.');
              // logout() is called within attemptRefreshToken on failure
            } else {
              console.log('Initial auth check: Refresh successful.');
            }
          }
        }
      } else {
        console.log('No tokens found in storage.');
        // Ensure user is null if no tokens
        if (isMounted) setUser(null);
      }

      if (isMounted) setIsLoading(false);
    };

    checkAuthStatus();

    return () => {
      isMounted = false; // Cleanup function to set flag
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, attemptRefreshToken, logout]); // Added logout dependency

  // Effect to listen for unauthenticated events from Apollo error link
  useEffect(() => {
    const handleUnauthenticated = async () => {
      console.log('AuthContext received unauthenticated event. Attempting refresh...');
      // Note: We might want to add logic here to prevent multiple simultaneous refresh attempts
      // if many requests fail at once. For now, it calls refresh directly.
      await attemptRefreshToken();
      // The attemptRefreshToken function handles logout on failure.
    };

    const unsubscribe = authEvents.on(AUTH_EVENTS.UNAUTHENTICATED, handleUnauthenticated);

    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
    };
  }, [attemptRefreshToken]); // Depend on attemptRefreshToken



  const value = {
    accessToken,
    refreshToken,
    user,
    isLoading,
    login,
    logout,
    attemptRefreshToken, // Expose refresh function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};