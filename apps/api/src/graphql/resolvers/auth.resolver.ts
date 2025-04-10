import { authService } from '../../services/auth.service'; // Import the singleton instance
import { MutationResolvers } from '../generated/graphql'; // Import generated types
import { ApiContext } from '../../types/context'; // Import context type if needed

// Define the resolvers for the Mutation type, specifically for auth operations
const authResolver: MutationResolvers = {
  // Resolver for the register mutation
  register: async (_parent, { input }, _context: ApiContext) => {
    // Call the register method from the AuthService
    // Input validation (e.g., using Zod) could be added here or in the service
    try {
      const authPayload = await authService.register(input);
      return authPayload;
    } catch (error: any) {
      // Handle specific errors (e.g., user already exists) or rethrow
      console.error('Registration Error:', error.message);
      // Consider using ApolloError for better client-side error handling
      throw new Error(error.message || 'Failed to register user.');
    }
  },

  // Resolver for the login mutation
  login: async (_parent, { input }, _context: ApiContext) => {
    // Call the login method from the AuthService
    try {
      const authPayload = await authService.login(input);
      return authPayload;
    } catch (error: any) {
      console.error('Login Error:', error.message);
      // Handle specific errors (e.g., invalid credentials)
      throw new Error(error.message || 'Failed to login.');
    }
  },

  // Resolver for the refreshToken mutation
  refreshToken: async (_parent, { token }, _context: ApiContext) => {
    // Call the refreshToken method from the AuthService
    try {
      const authPayload = await authService.refreshToken(token);
      return authPayload;
    } catch (error: any) {
      console.error('RefreshToken Error:', error.message);
      // Handle specific errors (e.g., invalid/expired token)
      throw new Error(error.message || 'Failed to refresh token.');
    }
  },
};

export default {
  Mutation: authResolver, // Export under the Mutation key
};