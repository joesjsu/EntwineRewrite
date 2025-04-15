import { pgTable, serial, text, varchar, timestamp, boolean, integer, jsonb, primaryKey, index, uniqueIndex, pgEnum, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
// --- Enums ---
// Add enums as needed, e.g., for gender, roles, screen types, rule types etc.
// export const genderEnum = pgEnum('gender', ['male', 'female', 'non-binary', 'other']);
// export const introScreenTypeEnum = pgEnum('intro_screen_type', ['ai_chat', 'relationship_coach']);
// export const photoRuleTypeEnum = pgEnum('photo_rule_type', ['Distribution', 'Maximum', 'Minimum']);
export const platformEnum = pgEnum('platform', ['ios', 'android', 'web']);
export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);
export const swipeActionEnum = pgEnum('swipe_action', ['like', 'dislike']); // Enum for swipe actions


// --- Zod Validation Schemas ---

export const SendRegistrationMessageInputSchema = z.object({
  message: z.string().min(1, { message: "Message cannot be empty" }), // Assuming non-empty based on resolver comment
  // Allowing any object structure for now. Refine if specific state keys are known/required.
  currentState: z.object({}).passthrough(),
});

export const RequestChatFeedbackInputSchema = z.object({
  chatId: z.string().min(1, { message: "Chat ID cannot be empty" }),
  scope: z.enum(['RECENT', 'FULL', 'DRAFT']),
  draftContent: z.string().nullable().optional(),
  recentMessageCount: z.number().int().positive().nullable().optional(),
}).refine(data => {
  // If scope is DRAFT, draftContent must be a non-empty string
  if (data.scope === 'DRAFT') {
    return typeof data.draftContent === 'string' && data.draftContent.length > 0;
  }
  return true;
}, {
  message: "Draft content must be provided and non-empty when scope is DRAFT",
  path: ["draftContent"], // Path of the error
});

export const GetPotentialMatchesArgsSchema = z.object({
  limit: z.number().int().positive().nullable().optional(),
});


// --- Tables ---

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phoneNumber: varchar('phone_number', { length: 20 }).unique(),
  hashedPassword: text('hashed_password').notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  gender: varchar('gender', { length: 50 }), // TODO: Consider genderEnum
  birthday: timestamp('birthday', { mode: 'date' }),
  bio: text('bio'),
  location: jsonb('location'), // { city, state, country, lat, lon }
  registrationStep: integer('registration_step').default(0).notNull(),
  profileComplete: boolean('profile_complete').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  role: userRoleEnum('role').default('USER').notNull(), // Added role column
  email: varchar('email', { length: 255 }).unique().notNull(), // Added email column
  isActive: boolean('is_active').default(true).notNull(), // Added isActive column
}, (table) => ({
  phoneIdx: uniqueIndex('phone_idx').on(table.phoneNumber),
  emailIdx: uniqueIndex('email_idx').on(table.email), // Added index for email
}));

export const userPhotos = pgTable('user_photos', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(), // Or use bytea/blob if storing directly, or reference cloud storage URL
  order: integer('order').default(0),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userPhotoIdx: index('user_photo_idx').on(table.userId),
}));

export const physicalPreferences = pgTable('physical_preferences', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  preferences: jsonb('preferences'), // Store complex AI analysis results
  confidence: decimal('confidence', { precision: 5, scale: 4 }), // Confidence score for the analysis
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const datingPreferences = pgTable('dating_preferences', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  genderPreference: varchar('gender_preference', { length: 50 }), // TODO: Consider enum
  minAge: integer('min_age'),
  maxAge: integer('max_age'),
  maxDistance: integer('max_distance'), // In miles or km
  // Add other preferences like relationship goals, etc.
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userInterests = pgTable('user_interests', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  interests: jsonb('interests'), // [{ name: string, source: 'ai' | 'user', confidence?: number }]
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userValues = pgTable('user_values', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  values: jsonb('values'), // [{ name: string, source: 'registration' | 'user', highlighted?: boolean }]
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userDealbreakers = pgTable('user_dealbreakers', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  dealbreakers: jsonb('dealbreakers'), // [{ name: string, category: string, highlighted?: boolean }]
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userImprovementAreas = pgTable('user_improvement_areas', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  improvementAreas: jsonb('improvement_areas'), // [{ name: string, source: 'ai' | 'user', highlighted?: boolean }]
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  user1Id: integer('user1_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  user2Id: integer('user2_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('pending'), // e.g., pending, matched, declined, expired
  matchPercentage: decimal('match_percentage', { precision: 5, scale: 2 }), // Overall score
  scores: jsonb('scores'), // Store dimensional scores { physical, values, interests, etc. }
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userMatchIdx: index('user_match_idx').on(table.user1Id, table.user2Id),
  statusIdx: index('match_status_idx').on(table.status),
}));

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  matchMsgIdx: index('match_msg_idx').on(table.matchId),
  senderMsgIdx: index('sender_msg_idx').on(table.senderId),
}));

export const aiPersonas = pgTable('ai_personas', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  bio: text('bio'),
  gender: varchar('gender', { length: 50 }), // TODO: Consider enum
  minAge: integer('min_age'),
  maxAge: integer('max_age'),
  personalityTraits: jsonb('personality_traits'), // e.g., Big Five scores
  promptTemplate: text('prompt_template'), // Base prompt for this persona
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiChatSessions = pgTable('ai_chat_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  personaId: integer('persona_id').notNull().references(() => aiPersonas.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).default('active'), // e.g., active, completed
  messageCount: integer('message_count').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userPersonaIdx: index('user_persona_idx').on(table.userId, table.personaId),
}));

export const aiChatMessages = pgTable('ai_chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => aiChatSessions.id, { onDelete: 'cascade' }),
  sender: varchar('sender', { length: 10 }).notNull(), // 'user' or 'ai'
  content: text('content').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }), // Timestamp when the message was read
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionMsgIdx: index('session_msg_idx').on(table.sessionId),
}));

export const communicationStyles = pgTable('communication_styles', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  styles: jsonb('styles'), // { directness: number, expressiveness: number, ... }
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  analysisVersion: varchar('analysis_version', { length: 50 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const communicationPreferences = pgTable('communication_preferences', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  preferences: jsonb('preferences'), // { preferredDirectness: number, ... }
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const communicationResponsePatterns = pgTable('communication_response_patterns', {
  userId: integer('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  patterns: jsonb('patterns'), // { timing, responseSpeed, topics, sentiment, etc. }
  confidence: decimal('confidence', { precision: 5, scale: 4 }),
  analysisVersion: varchar('analysis_version', { length: 50 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const coachConfig = pgTable('coach_config', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  preAssessmentQuestions: jsonb('pre_assessment_questions'), // Array of questions/replies
  postAssessmentQuestions: jsonb('post_assessment_questions'), // Array of questions/replies
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const introScreens = pgTable('intro_screens', {
  id: serial('id').primaryKey(),
  screenType: varchar('screen_type', { length: 50 }).notNull(), // TODO: Consider introScreenTypeEnum
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  additionalInfo: text('additional_info'),
  ctaText: varchar('cta_text', { length: 100 }),
  iconName: varchar('icon_name', { length: 50 }),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  typeOrderIdx: index('type_order_idx').on(table.screenType, table.displayOrder),
}));

export const photoSettings = pgTable('photo_settings', {
  id: serial('id').primaryKey(), // Use serial for potential multiple setting versions
  dynamicPhotoCountEnabled: boolean('dynamic_photo_count_enabled').default(false),
  minPhotosToShow: integer('min_photos_to_show').default(10),
  maxImportancePhotos: integer('max_importance_photos').default(30),
  aiAnalysisEnabled: boolean('ai_analysis_enabled').default(true),
  // Add other settings like rules engine config reference if needed
  isActive: boolean('is_active').default(false).notNull(), // Ensure only one is active
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const swipes = pgTable('swipes', {
  swiperId: integer('swiper_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  swipedId: integer('swiped_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: swipeActionEnum('action').notNull(), // 'like' or 'dislike'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Composite primary key to ensure one swipe per user pair
  pk: primaryKey({ columns: [table.swiperId, table.swipedId] }),
  // Index to quickly find swipes by a specific user
  swiperIdx: index('swiper_idx').on(table.swiperId),
  // Index to quickly find swipes towards a specific user (useful for checking reciprocal likes)
  swipedIdx: index('swiped_idx').on(table.swipedId),
}));

export const ratingPhotos = pgTable('rating_photos', {
  id: serial('id').primaryKey(),
  url: text('url').notNull().unique(),
  gender: varchar('gender', { length: 50 }), // TODO: Consider enum
  ageGroup: varchar('age_group', { length: 50 }), // e.g., '20-25', '30-35'
  attributes: jsonb('attributes'), // Store AI-detected attributes
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  genderAgeIdx: index('gender_age_idx').on(table.gender, table.ageGroup),
}));


export const aiFeatureConfigs = pgTable('ai_feature_configs', {
  featureKey: varchar('feature_key', { length: 100 }).primaryKey(), // e.g., 'profile_analysis', 'coaching_intro'
  providerName: varchar('provider_name', { length: 50 }).notNull(), // e.g., 'google', 'openai'
  modelName: varchar('model_name', { length: 100 }).notNull(), // e.g., 'gemini-1.5-pro-latest'
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  featureKeyIdx: uniqueIndex('feature_key_idx').on(table.featureKey), // Ensure unique config per feature
}));

export const userDeviceTokens = pgTable('user_device_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  platform: platformEnum('platform').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('user_device_token_user_idx').on(table.userId),
  uniqueTokenUser: uniqueIndex('user_device_token_unique_idx').on(table.userId, table.token),
}));


// --- Relations ---

export const usersRelations = relations(users, ({ one, many }) => ({
  photos: many(userPhotos),
  physicalPreferences: one(physicalPreferences),
  datingPreferences: one(datingPreferences),
  interests: one(userInterests),
  values: one(userValues),
  dealbreakers: one(userDealbreakers),
  improvementAreas: one(userImprovementAreas),
  matchesAsUser1: many(matches, { relationName: 'user1' }),
  matchesAsUser2: many(matches, { relationName: 'user2' }),
  sentMessages: many(messages),
  aiChatSessions: many(aiChatSessions),
  communicationStyle: one(communicationStyles),
  communicationPreferences: one(communicationPreferences),
  communicationResponsePatterns: one(communicationResponsePatterns),
  deviceTokens: many(userDeviceTokens),
  swipesMade: many(swipes, { relationName: 'swipesMade' }),
  swipesReceived: many(swipes, { relationName: 'swipesReceived' }),
}));

export const userPhotosRelations = relations(userPhotos, ({ one }) => ({
  user: one(users, {
    fields: [userPhotos.userId],
    references: [users.id],
  }),
}));

export const physicalPreferencesRelations = relations(physicalPreferences, ({ one }) => ({
  user: one(users, {
    fields: [physicalPreferences.userId],
    references: [users.id],
  }),
}));

export const datingPreferencesRelations = relations(datingPreferences, ({ one }) => ({
  user: one(users, {
    fields: [datingPreferences.userId],
    references: [users.id],
  }),
}));

export const userInterestsRelations = relations(userInterests, ({ one }) => ({
  user: one(users, {
    fields: [userInterests.userId],
    references: [users.id],
  }),
}));

export const userValuesRelations = relations(userValues, ({ one }) => ({
  user: one(users, {
    fields: [userValues.userId],
    references: [users.id],
  }),
}));

export const userDealbreakersRelations = relations(userDealbreakers, ({ one }) => ({
  user: one(users, {
    fields: [userDealbreakers.userId],
    references: [users.id],
  }),
}));

export const userImprovementAreasRelations = relations(userImprovementAreas, ({ one }) => ({
  user: one(users, {
    fields: [userImprovementAreas.userId],
    references: [users.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  user1: one(users, {
    fields: [matches.user1Id],
    references: [users.id],
    relationName: 'user1',
  }),
  user2: one(users, {
    fields: [matches.user2Id],
    references: [users.id],
    relationName: 'user2',
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const aiPersonasRelations = relations(aiPersonas, ({ many }) => ({
  chatSessions: many(aiChatSessions),
}));

export const aiChatSessionsRelations = relations(aiChatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [aiChatSessions.userId],
    references: [users.id],
  }),
  persona: one(aiPersonas, {
    fields: [aiChatSessions.personaId],
    references: [aiPersonas.id],
  }),
  messages: many(aiChatMessages),
}));

export const aiChatMessagesRelations = relations(aiChatMessages, ({ one }) => ({
  session: one(aiChatSessions, {
    fields: [aiChatMessages.sessionId],
    references: [aiChatSessions.id],
  }),
}));

export const communicationStylesRelations = relations(communicationStyles, ({ one }) => ({
  user: one(users, {
    fields: [communicationStyles.userId],
    references: [users.id],
  }),
}));

export const communicationPreferencesRelations = relations(communicationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [communicationPreferences.userId],
    references: [users.id],
  }),
}));

// Add relation from users to swipes
export const swipesRelations = relations(swipes, ({ one }) => ({
  swiper: one(users, {
    fields: [swipes.swiperId],
    references: [users.id],
    relationName: 'swipesMade',
  }),
  swiped: one(users, {
    fields: [swipes.swipedId],
    references: [users.id],
    relationName: 'swipesReceived',
  }),
}));

// Add relation from users to swipes (many swipes made, many swipes received)
// Need to adjust the existing usersRelations

export const communicationResponsePatternsRelations = relations(communicationResponsePatterns, ({ one }) => ({
  user: one(users, {
    fields: [communicationResponsePatterns.userId],
    references: [users.id],
  }),
}));

export const userDeviceTokensRelations = relations(userDeviceTokens, ({ one }) => ({
  user: one(users, {
    fields: [userDeviceTokens.userId],
    references: [users.id],
  }),
}));


// No explicit relations needed for config/setting tables unless linked to users/other entities