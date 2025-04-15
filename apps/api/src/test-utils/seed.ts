import { db, sql } from '../db'; // Correct path relative to test-utils/
import {
  users,
  datingPreferences,
  matches,
  userPhotos,
  physicalPreferences,
  userInterests,
  userValues,
  userDealbreakers,
  userImprovementAreas,
  messages,
  aiChatSessions,
  aiChatMessages,
  communicationStyles,
  communicationPreferences,
  communicationResponsePatterns,
  userDeviceTokens,
  aiPersonas,
  // Import other tables if needed for seeding/clearing
} from '@entwine-rewrite/shared';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// Define types for insert and select models
type InsertUser = InferInsertModel<typeof users>;
type SelectUser = InferSelectModel<typeof users>;
type InsertDatingPreferences = InferInsertModel<typeof datingPreferences>;
type SelectDatingPreferences = InferSelectModel<typeof datingPreferences>;
type InsertMatch = InferInsertModel<typeof matches>;
type SelectMatch = InferSelectModel<typeof matches>;

/**
 * Seeds a user into the database with default values for required fields.
 * @param userData Partial user data to override defaults.
 * @returns The inserted user record.
 */
export async function seedUser(
  userData: Partial<InsertUser> = {},
): Promise<SelectUser> {
  const defaultUser: InsertUser = {
    // Provide defaults for required fields that don't have DB defaults
    hashedPassword: userData.hashedPassword ?? 'default_hashed_password', // Use a placeholder hash
    email: userData.email ?? `testuser_${Date.now()}@example.com`, // Ensure uniqueness
    firstName: userData.firstName ?? 'Test',
    lastName: userData.lastName ?? 'User',
    gender: userData.gender ?? 'other',
    birthday: userData.birthday ?? new Date('1990-01-01'),
    // role defaults to 'USER' in schema
    // isActive defaults to true in schema
    // createdAt/updatedAt default to now() in schema
    // registrationStep defaults to 0 in schema
    // profileComplete defaults to false in schema
    ...userData, // Override defaults with provided data
  };

  const [insertedUser] = await db
    .insert(users)
    .values(defaultUser)
    .returning();

  if (!insertedUser) {
    throw new Error('Failed to insert user');
  }
  return insertedUser;
}

/**
 * Seeds dating preferences for a user.
 * @param prefsData The dating preferences data to insert. Must include userId.
 * @returns The inserted dating preferences record.
 */
export async function seedDatingPreferences(
  prefsData: InsertDatingPreferences,
): Promise<SelectDatingPreferences> {
   const [insertedPrefs] = await db
    .insert(datingPreferences)
    .values(prefsData)
    .returning();

   if (!insertedPrefs) {
     throw new Error('Failed to insert dating preferences');
   }
   return insertedPrefs;
}

/**
 * Seeds a match record between two users.
 * @param matchData The match data to insert. Must include user1Id and user2Id.
 * @returns The inserted match record.
 */
export async function seedMatch(matchData: InsertMatch): Promise<SelectMatch> {
  const [insertedMatch] = await db
    .insert(matches)
    .values(matchData)
    .returning();

  if (!insertedMatch) {
    throw new Error('Failed to insert match');
  }
  return insertedMatch;
}

/**
 * Clears relevant tables in the test database.
 * Uses TRUNCATE ... RESTART IDENTITY CASCADE for efficiency and handling dependencies.
 */
export async function clearDatabase(): Promise<void> {
  // List all tables that might contain test data and need clearing.
  // Order matters if not using CASCADE or if CASCADE is restricted.
  // Truncating 'users' with CASCADE should handle most dependencies.
  try {
    // Truncate tables individually in reverse order of dependency
    // Using RESTART IDENTITY CASCADE to reset sequences and handle FKs.
    await db.execute(sql`TRUNCATE TABLE "messages" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "ai_chat_messages" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "ai_chat_sessions" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "matches" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "dating_preferences" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "user_photos" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "physical_preferences" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "user_interests" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "user_values" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "user_dealbreakers" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "user_improvement_areas" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "communication_styles" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "communication_preferences" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "communication_response_patterns" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "user_device_tokens" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;`);
    await db.execute(sql`TRUNCATE TABLE "ai_personas" RESTART IDENTITY CASCADE;`);
    // Add other tables here if needed, ensuring correct order
    // console.log('Test database cleared successfully.'); // Optional: uncomment for debugging
  } catch (error) {
    console.error('Error clearing test database:', error);
    // Re-throw the error to ensure the test setup/teardown fails clearly
    throw error;
  }
}