// apps/api/src/types/context.ts
import type { authService } from '@/services/auth.service';
import type { UserRole } from '@/graphql/generated/graphql'; // Import UserRole enum

// Define a basic structure for the user object expected in the context
interface ContextUser {
  id: number; // Assuming user ID is a number based on schema usage
  role?: UserRole; // Add the role property (optional as user might not be logged in)
}

// Define the GraphQL context type
export interface ApiContext {
  user?: ContextUser; // User might be undefined if not authenticated
  authService: typeof authService; // Add the auth service instance type
  // Add other context properties if needed (e.g., db connection, loaders)
}