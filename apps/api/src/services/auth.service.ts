import { db, users } from '../db'; // Import db instance and users table
import { eq } from '@entwine-rewrite/shared'; // Import eq directly from shared package
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis'; // Import Redis type
import redisClient from '../config/redis'; // Import Redis client instance (default export)
import { User } from '../graphql/generated/graphql'; // Import the generated User type
type RegisterInput = any; // TODO: Replace with generated type
type LoginInput = any;    // TODO: Replace with generated type
// Type for the final payload returned by public methods
type AuthPayloadWithUser = {
  accessToken: string;
  refreshToken?: string;
  user: User; // Use the generated User type
};
// Type for the internal token generation result
type TokenPayload = {
  accessToken: string;
  refreshToken?: string;
};

// Load JWT secrets from environment variables (ensure these are set in .env!)
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  console.warn('JWT secrets are not set in environment variables! Using default insecure secrets.');
  // In a real app, you should throw an error or use a more secure fallback/config system
}
const EFFECTIVE_JWT_ACCESS_SECRET = JWT_ACCESS_SECRET || 'insecure-default-access-secret';
const EFFECTIVE_JWT_REFRESH_SECRET = JWT_REFRESH_SECRET || 'insecure-default-refresh-secret';

export class AuthService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    console.log('AuthService initialized with Redis client.');
  }

  // Placeholder for JWT generation
  private async generateTokens(userId: number): Promise<TokenPayload> { // Return only tokens
    console.log(`Generating tokens for user ${userId}`);
    // Implement actual JWT signing
    const accessToken = jwt.sign({ sub: userId }, EFFECTIVE_JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ sub: userId }, EFFECTIVE_JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    // Store the refresh token in Redis, keyed by user ID. Overwrites previous.
    // Consider a more robust strategy (e.g., multiple tokens per user) if needed.
    const redisKey = `refreshToken:${userId}`;
    await this.redis.set(redisKey, refreshToken, 'EX', 60 * 60 * 24 * 7); // 7 days expiry in seconds
    console.log(`Stored refresh token for user ${userId} in Redis.`);

    return { accessToken, refreshToken }; // Only return tokens here
  }

  async register(input: RegisterInput): Promise<AuthPayloadWithUser> { // Return type includes user
    console.log('AuthService: Registering user', input.phoneNumber);

    // 1. Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.phoneNumber, input.phoneNumber),
    });
    if (existingUser) {
      throw new Error('Phone number already registered.');
    }

    // 2. Hash the password (using await)
    const hashedPassword = await bcrypt.hash(input.password, 10); // Salt rounds = 10
    // const hashedPassword = `hashed_${input.password}`; // Placeholder removed

    // 3. Create the user in the database
    const newUser = await db.insert(users).values({
      phoneNumber: input.phoneNumber,
      hashedPassword: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      // Set initial registration step, profileComplete status etc.
      registrationStep: 0,
      profileComplete: false,
    }).returning({ id: users.id });

    // Check if user creation was successful and ID exists
    if (!newUser?.[0]?.id) {
      throw new Error('Failed to create user or retrieve ID.');
    }
    const userId = newUser[0].id;

    // 4. Generate JWT tokens
    // Fetch the newly created user data to return
    // Fetch the newly created user data, selecting all fields required by the GraphQL User type
    const createdUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { // Ensure all fields needed for the GraphQL User type are selected
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        profileComplete: true,
        registrationStep: true,
        createdAt: true,
        updatedAt: true,
        // Add bio, birthday, email, gender if they become non-nullable in GraphQL User
      }
    });

    if (!createdUser) {
      // This should ideally not happen if insertion succeeded
      throw new Error('Failed to retrieve newly created user data.');
    }

    // 4. Generate JWT tokens
    const tokens = await this.generateTokens(userId); // Await token generation/storage

    // 5. Return tokens and user data
    // Map the DB result to the GraphQL User type structure
    const userPayload: User = {
        __typename: 'User', // Add __typename for GraphQL
        id: createdUser.id.toString(), // Convert number ID to string
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        role: createdUser.role, // Drizzle should infer 'USER' | 'ADMIN'
        profileComplete: createdUser.profileComplete,
        registrationStep: createdUser.registrationStep,
        // Format dates as strings (ISO 8601 is common for GraphQL DateTime)
        createdAt: createdUser.createdAt.toISOString(),
        updatedAt: createdUser.updatedAt.toISOString(),
        // Add null or fetched values for other optional fields like bio, birthday, email, gender
        bio: null, // Assuming bio is nullable and not fetched
        birthday: null, // Assuming birthday is nullable and not fetched
        email: null, // Assuming email is nullable and not fetched
        gender: null, // Assuming gender is nullable and not fetched
    };
    return { ...tokens, user: userPayload };
  }

  async login(input: LoginInput): Promise<AuthPayloadWithUser> { // Return type includes user
    console.log('AuthService: Logging in user', input.phoneNumber);

    // 1. Find the user by phone number
    // Fetch user including all fields needed for the GraphQL User type
    const user = await db.query.users.findFirst({
      where: eq(users.phoneNumber, input.phoneNumber),
      columns: { // Ensure all fields needed for the GraphQL User type are selected
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        profileComplete: true,
        registrationStep: true,
        createdAt: true,
        updatedAt: true,
        hashedPassword: true, // Still need this for comparison
        // Add bio, birthday, email, gender if they become non-nullable in GraphQL User
      }
    });
    if (!user) {
      throw new Error('Invalid phone number or password.');
    }

    // 2. Verify the password (using await)
    const isPasswordValid = await bcrypt.compare(input.password, user.hashedPassword);
    // const isPasswordValid = `hashed_${input.password}` === user.hashedPassword; // Placeholder comparison removed
    if (!isPasswordValid) {
      throw new Error('Invalid phone number or password.');
    }

    // 3. Generate JWT tokens
    const tokens = await this.generateTokens(user.id); // Await token generation/storage

    // 4. Return tokens and the user object found earlier
    // Map the DB result to the GraphQL User type structure
    const userPayload: User = {
        __typename: 'User', // Add __typename for GraphQL
        id: user.id.toString(), // Convert number ID to string
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileComplete: user.profileComplete,
        registrationStep: user.registrationStep,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        // Add null or fetched values for other optional fields
        bio: null,
        birthday: null,
        email: null,
        gender: null,
    };

    return { ...tokens, user: userPayload };
  }

  async refreshToken(token: string): Promise<AuthPayloadWithUser> { // Return type includes user
    console.log('AuthService: Refreshing token');

    try {
      // 1. Verify the refresh token structure *first* (cheap check)
      const decoded = jwt.verify(token, EFFECTIVE_JWT_REFRESH_SECRET);

      // 2. Validate the payload structure and type of 'sub'
      if (typeof decoded !== 'object' || decoded === null || !('sub' in decoded)) {
          throw new Error('Invalid token payload: Structure mismatch.');
      }

      // 3. Ensure 'sub' is a number
      if (typeof decoded.sub !== 'number') {
          throw new Error('Invalid token payload: User ID (sub) is not a number.');
      }

      // TypeScript now knows decoded.sub is a number within this scope
      const userId = decoded.sub;

      // 4. Construct Redis key
      const redisKey = `refreshToken:${userId}`;

      // 5. Check if the provided token exists and matches the one stored in Redis
      const storedToken = await this.redis.get(redisKey);

      if (!storedToken) {
        throw new Error('Refresh token not found in store (likely expired or revoked).');
      }

      if (storedToken !== token) {
        // This could indicate a stolen token attempt or race condition. Invalidate for safety.
        await this.redis.del(redisKey); // Remove the stored token
        throw new Error('Provided refresh token does not match stored token.');
      }

      // 6. Optional: Check if the user still exists in the database (already present)
      // Fetch the full user object needed for the payload
      // Fetch the full user object needed for the payload
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { // Ensure all fields needed for the GraphQL User type are selected
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          profileComplete: true,
          registrationStep: true,
          createdAt: true,
          updatedAt: true,
          // Add bio, birthday, email, gender if they become non-nullable in GraphQL User
        }
      });

      if (!user) {
        // If user is deleted, token should be invalid. Remove from Redis.
        await this.redis.del(redisKey);
        throw new Error('User associated with token not found.');
      }

      // 7. Generate new tokens (access and refresh for rotation)
      // generateTokens will automatically store the new refresh token in Redis, overwriting the old one.
      console.log(`Refresh token verified via Redis & JWT for user ${userId}, generating new tokens.`);
      const newTokens = await this.generateTokens(userId); // Await token generation/storage

      // Return new tokens and the fetched user data
      // Map the DB result to the GraphQL User type structure
      const userPayload: User = {
          __typename: 'User', // Add __typename for GraphQL
          id: user.id.toString(), // Convert number ID to string
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileComplete: user.profileComplete,
          registrationStep: user.registrationStep,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          // Add null or fetched values for other optional fields
          bio: null,
          birthday: null,
          email: null,
          gender: null,
      };
      return { ...newTokens, user: userPayload };
    } catch (error: any) {
      console.error('Refresh token error:', error.message);
      // Handle specific JWT errors like TokenExpiredError, JsonWebTokenError
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired.');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token.');
      } else {
        // Rethrow other unexpected errors
        throw error;
      }
    }
  }


  // async refreshToken(token: string): Promise<AuthPayload> { ... } // Method implemented above

  // TODO: Add verifyAccessToken method (used in context setup)
  // verifyAccessToken(token: string): { userId: number } | null { ... }
}

// Export a singleton instance
// Ensure Redis client is available before creating the service instance
if (!redisClient) {
  throw new Error('Redis client is not available. AuthService requires a Redis connection.');
}
export const authService = new AuthService(redisClient); // Pass Redis client instance