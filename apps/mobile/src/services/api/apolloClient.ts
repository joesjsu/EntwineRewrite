import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define keys for AsyncStorage
const ACCESS_TOKEN_KEY = 'entwine_access_token';

// Define API URL (replace with environment variable later)
const API_URL = 'http://localhost:4001/graphql'; // Default for local dev

// Event emitter for auth events
export const authEvents = {
  listeners: new Map(),
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  },
  
  emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(...args));
    }
  }
};

// Auth events constants
export const AUTH_EVENTS = {
  UNAUTHENTICATED: 'unauthenticated',
};

// Create Apollo client
export const getApolloClient = async () => {
  // Create HTTP link
  const httpLink = createHttpLink({
    uri: API_URL,
  });

  // Create auth link
  const authLink = setContext(async (_, { headers }) => {
    // Get the authentication token from AsyncStorage if it exists
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    
    // Return the headers to the context so httpLink can read them
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      }
    };
  });

  // Create error link
  const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
    if (graphQLErrors) {
      for (let err of graphQLErrors) {
        switch (err.extensions?.code) {
          // Apollo Server sends code UNAUTHENTICATED for auth errors by default
          case 'UNAUTHENTICATED': {
            console.warn(`[GraphQL Auth Error]: Message: ${err.message}, Code: ${err.extensions.code}. Emitting event.`);
            // Emit an event that the AuthProvider can listen to
            authEvents.emit(AUTH_EVENTS.UNAUTHENTICATED, { operation, forward });
            break;
          }
          default:
            console.error(`[GraphQL Error]: Message: ${err.message}`, err);
        }
      }
    }

    if (networkError) {
      console.error(`[Network Error]: ${networkError}`);
    }
  });

  // Combine the links: error -> auth -> http
  const link = ApolloLink.from([errorLink, authLink, httpLink]);

  // Create and return the Apollo client
  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
      },
    },
  });
};