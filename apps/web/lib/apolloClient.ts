import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from "@apollo/client/link/error";
import { authEvents, AUTH_EVENTS } from './authEvents'; // Import the event emitter

// Define key for localStorage
const ACCESS_TOKEN_KEY = 'entwine_access_token';
// Define API URL (replace with environment variable later)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql'; // Default for local dev

const httpLink = createHttpLink({
  uri: API_URL,
});

// Middleware to set the authorization header
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

// Link to handle errors, especially authentication errors
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (let err of graphQLErrors) {
      switch (err.extensions?.code) {
        // Apollo Server sends code UNAUTHENTICATED for auth errors by default
        case 'UNAUTHENTICATED': {
          console.warn(`[GraphQL Auth Error]: Message: ${err.message}, Code: ${err.extensions.code}. Emitting event.`);
          // Emit an event that the AuthProvider can listen to.
          // Pass the original operation and forward function in case the listener wants to retry.
          authEvents.emit(AUTH_EVENTS.UNAUTHENTICATED, { operation, forward });
          // We don't handle the refresh/logout directly here anymore.
          // The AuthProvider will handle the response to the event.
          // We might need a mechanism to pause subsequent requests until refresh attempt completes.
          // For simplicity now, we just emit and let AuthProvider handle it.
          break; // Important to break the switch case
        }
        // Handle other specific GraphQL errors if needed
        default:
          console.error(`[GraphQL Error]: Message: ${err.message}`, err);
      }
    }
  }

  if (networkError) {
    console.error(`[Network Error]: ${networkError}`);
    // TODO: Handle network errors (e.g., offline status, server down)
    // Maybe check if it's a 401 network error specifically if backend doesn't use GraphQL error codes
  }
});


// Combine the links: error -> auth -> http
const link = ApolloLink.from([errorLink, authLink, httpLink]);

const client = new ApolloClient({
  link: link,
  cache: new InMemoryCache(),
  // Optional: Default options for queries/mutations
  // defaultOptions: {
  //   watchQuery: {
  //     fetchPolicy: 'cache-and-network',
  //   },
  // },
});

export default client;