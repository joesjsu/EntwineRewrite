import { db } from '../../db';
import { aiService, KnownFeatureKey } from '../../ai/ai.service';
import redisClient from '../../config/redis'; // Import Redis client instance (default export)
import { Redis } from 'ioredis'; // Import Redis type
import * as schema from '@entwine-rewrite/shared';
import { eq, ne, and, or, sql, gte, lte, notInArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
// import { logger } from '../../config/logger'; // Assuming logger exists
const logger = console; // Temporary logger replacement

// Define the result type for matches
type MatchResult = typeof schema.users.$inferSelect & {
  compatibilityScore: number;
  scoreBreakdown?: Record<string, number>; // Optional detailed scores
};

// Helper function to calculate age from birthday
function calculateAge(birthday: Date | null | undefined): number | null {
  if (!birthday) return null;
  const ageDifMs = Date.now() - birthday.getTime();
  const ageDate = new Date(ageDifMs); // miliseconds from epoch
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Define the type for the user object returned by the query explicitly using Drizzle's inferSelect
// This avoids the circular reference issue and uses the correct exported table names.
type UserSelectType = typeof schema.users.$inferSelect;
type DatingPreferenceSelectType = typeof schema.datingPreferences.$inferSelect;
type PhysicalPreferenceSelectType = typeof schema.physicalPreferences.$inferSelect;
type UserValueSelectType = typeof schema.userValues.$inferSelect; // Assuming table name is userValues
type UserInterestSelectType = typeof schema.userInterests.$inferSelect; // Assuming table name is userInterests
type CommunicationStyleSelectType = typeof schema.communicationStyles.$inferSelect; // Assuming table name is communicationStyles
type DealbreakerSelectType = typeof schema.userDealbreakers.$inferSelect; // Corrected table name
type PhotoSelectType = typeof schema.userPhotos.$inferSelect; // Corrected table name

type UserWithProfileData = UserSelectType & {
    datingPreferences: DatingPreferenceSelectType | null;
    physicalPreferences: PhysicalPreferenceSelectType | null;
    values: UserValueSelectType | null;
    interests: UserInterestSelectType | null;
    communicationStyle: CommunicationStyleSelectType | null;
    dealbreakers: DealbreakerSelectType | null; // Relation name might differ from table name, check usersRelations
    photos: PhotoSelectType[]; // Relation name might differ from table name, check usersRelations
};

// Cache constants
const USER_PROFILE_CACHE_PREFIX = 'userProfile:';
const USER_PROFILE_CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const COMPATIBILITY_CACHE_PREFIX = 'compatScore:';
const COMPATIBILITY_CACHE_TTL_SECONDS = 60 * 30; // 30 minutes (scores might change more often than profiles)

// Helper function to encapsulate the user query logic with caching
async function queryUserWithProfile(userId: number, redis: Redis): Promise<UserWithProfileData | null> {
    const cacheKey = `${USER_PROFILE_CACHE_PREFIX}${userId}`;

    try {
        // 1. Try fetching from cache
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            logger.debug(`Cache hit for user profile: ${userId}`);
            // Need to parse dates correctly if stored as strings
            const parsedData = JSON.parse(cachedData, (key, value) => {
                 // Example date parsing (adjust based on actual date fields)
                 if (key === 'birthday' || key === 'createdAt' || key === 'updatedAt') { // Add other date fields as needed
                    return value ? new Date(value) : null;
                 }
                 return value;
            });
            return parsedData as UserWithProfileData;
        }
    } catch (error) {
        logger.error(`Redis GET error for key ${cacheKey}:`, error);
        // Proceed to fetch from DB on cache error
    }

    logger.debug(`Cache miss for user profile: ${userId}. Fetching from DB.`);
    // 2. Fetch from DB on cache miss
    const dbResult = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        with: {
          datingPreferences: true,
          physicalPreferences: true,
          values: true,
          interests: true,
          communicationStyle: true,
          dealbreakers: true,
          photos: true,
        }
      });

    if (dbResult) {
        // 3. Store in cache if found in DB
        try {
            // Serialize carefully, ensuring dates are handled if needed
            await redis.set(cacheKey, JSON.stringify(dbResult), 'EX', USER_PROFILE_CACHE_TTL_SECONDS);
            logger.debug(`Stored user profile in cache: ${userId}`);
        } catch (error) {
            logger.error(`Redis SET error for key ${cacheKey}:`, error);
            // Return DB result even if caching fails
        }
    }

    return dbResult as UserWithProfileData | null; // Type assertion might be needed depending on exact return type
}

// Helper function for Jaccard Index
function calculateJaccardIndex(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}


// Helper function for Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180; // deg2rad below
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    0.5 - Math.cos(dLat)/2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a)); // Distance in km
}


export class MatchingService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    logger.info('Matching Service initialized with Redis client.');
  }

  /**
   * Finds potential matches for a given user based on criteria.
   * @param userId The ID of the user seeking matches.
   * @param limit Max number of matches to return.
   * @returns A list of potential matches with compatibility scores.
   */
  async findPotentialMatches(userId: number, limit: number = 20): Promise<MatchResult[]> {
    logger.info(`Finding matches for user ${userId}`);

    try {
      // 1. Fetch the target user's profile and preferences from DB using helper
      // Pass the redis instance from the service to the helper function
      const targetUserResult = await queryUserWithProfile(userId, this.redis);

      if (!targetUserResult || !targetUserResult.datingPreferences) {
        logger.error(`User or dating preferences not found for user ID: ${userId}`);
        // Consider throwing a specific error or returning empty array based on desired behavior
        return [];
      }
      // Use the result directly (Type is inferred UserWithProfileData)
      const targetUser = targetUserResult;


      // 2. Determine filter criteria from target user's preferences
      // Add null check before destructuring
      if (!targetUser.datingPreferences) {
          logger.error(`Dating preferences missing for target user ${userId} after initial check.`);
          return []; // Should not happen based on earlier check, but belts and suspenders
      }
      const { genderPreference, minAge, maxAge } = targetUser.datingPreferences;


      // Calculate birthday range for age filtering
      const now = new Date();
      // Users younger than minAge have birthdays AFTER this date
      const maxBirthDate = minAge ? new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate()) : undefined;
      // Users older than maxAge have birthdays BEFORE this date
      const minBirthDate = maxAge ? new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate()) : undefined;

      // 3. Find users this user has already matched with (either way)
      const existingMatchUserIds = await db
        .select({
          matchedUserId: sql<number>`CASE WHEN ${schema.matches.user1Id} = ${userId} THEN ${schema.matches.user2Id} ELSE ${schema.matches.user1Id} END`
        })
        .from(schema.matches)
        .where(or(
          eq(schema.matches.user1Id, userId),
          eq(schema.matches.user2Id, userId)
        ));

      const excludedUserIds = new Set<number>([userId, ...existingMatchUserIds.map(row => row.matchedUserId)]);


      // 4. Query potential candidates from DB
      const filters = [
        notInArray(schema.users.id, Array.from(excludedUserIds)), // Exclude self and existing matches
        eq(schema.users.profileComplete, true), // Only match complete profiles
      ];

      if (genderPreference && genderPreference !== 'any') { // Assuming 'any' means no gender filter
        filters.push(eq(schema.users.gender, genderPreference));
      }
      if (maxBirthDate) {
        filters.push(lte(schema.users.birthday, maxBirthDate)); // User birthday <= maxBirthDate (means user is >= minAge)
      }
      if (minBirthDate) {
        filters.push(gte(schema.users.birthday, minBirthDate)); // User birthday >= minBirthDate (means user is <= maxAge)
      }
      // TODO: Add filtering based on blocked users (requires block list table)

      const candidatesResult = await db.query.users.findMany({
         where: and(...filters),
         limit: limit * 10, // Fetch more candidates than needed initially for filtering/ranking
         with: { // Include necessary relations for ranking (use correct names)
            datingPreferences: true,
            physicalPreferences: true,
            values: true, // Correct relation name
            interests: true, // Correct relation name
            communicationStyle: true, // Correct relation name
            dealbreakers: true, // Correct relation name
            photos: true, // Add photos relation for candidates
         }
      });

      // Use candidates result directly (Type is inferred UserWithProfileData[])
      const candidates = candidatesResult;


      // --- 4b. Filter candidates by distance ---
      let candidatesFilteredByDistance = candidates;
      const targetLocation = targetUser.location as { lat?: number, lon?: number } | null;
      const maxDistance = targetUser.datingPreferences?.maxDistance; // Assuming distance is in KM

      if (targetLocation?.lat != null && targetLocation?.lon != null && maxDistance != null && maxDistance > 0) {
        candidatesFilteredByDistance = candidates.filter(candidate => {
          const candidateLocation = candidate.location as { lat?: number, lon?: number } | null;
          if (candidateLocation?.lat != null && candidateLocation?.lon != null) {
            const distance = calculateDistance(targetLocation.lat!, targetLocation.lon!, candidateLocation.lat, candidateLocation.lon);
            return distance <= maxDistance;
          }
          return false; // Exclude candidates without location data if distance filter is active
        });
        logger.info(`Filtered ${candidates.length - candidatesFilteredByDistance.length} candidates based on distance > ${maxDistance}km.`);
      } else {
        logger.info(`Distance filtering skipped for user ${userId} (missing location or maxDistance).`);
      }


      if (!candidatesFilteredByDistance.length) {
        logger.info(`No potential candidates found for user ${userId} after distance filtering.`);
        return [];
      }

      // 5. Calculate compatibility scores for each distance-filtered candidate
      const rankedMatchesPromises = candidatesFilteredByDistance.map(async (candidate) => {
         const { score, breakdown } = await this.calculateCompatibility(targetUser, candidate);
         // Filter out candidates who don't meet dealbreakers (already handled) or have zero score
         if (score > 0) {
            // We need the original candidate data structure for the return type MatchResult
            // Find the original candidate data structure (including relations) from the distance-filtered list
            const originalCandidate = candidatesFilteredByDistance.find(c => c.id === candidate.id)!;
            return { ...originalCandidate, compatibilityScore: score, scoreBreakdown: breakdown };
         }
         return null;
      });

      const rankedMatchesFiltered = (await Promise.all(rankedMatchesPromises)).filter(match => match !== null) as MatchResult[];


      // 6. Sort candidates by compatibility score (descending)
      rankedMatchesFiltered.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      // 7. Return the top N matches
      logger.info(`Found ${rankedMatchesFiltered.length} potential matches for user ${userId}, returning top ${limit}.`);
      return rankedMatchesFiltered.slice(0, limit);

    } catch (error) {
      logger.error(`Error finding matches for user ${userId}:`, error);
      // Depending on policy, either re-throw, return empty, or return a specific error object
      return [];
    }
  }

  /**
   * Calculates a multi-dimensional compatibility score between two users.
   * @param userA The target user object.
   * @param userB The candidate user object.
   * @returns A numerical compatibility score (0-1) and breakdown.
   */
  // Use the inferred type UserWithProfileData
  private async calculateCompatibility(userA: UserWithProfileData, userB: UserWithProfileData): Promise<{ score: number, breakdown: Record<string, number> }> {
    // --- 0. Cache Check ---
    // Ensure consistent key order (e.g., lower ID first)
    const userIds = [userA.id, userB.id].sort((a, b) => a - b);
    const cacheKey = `${COMPATIBILITY_CACHE_PREFIX}${userIds[0]}-${userIds[1]}`;

    try {
        const cachedData = await this.redis.get(cacheKey);
        if (cachedData) {
            logger.debug(`Cache hit for compatibility score: ${userA.id}-${userB.id}`);
            return JSON.parse(cachedData); // Assuming score/breakdown are simple JSON
        }
    } catch (error) {
        logger.error(`Redis GET error for compatibility key ${cacheKey}:`, error);
        // Proceed to calculate on cache error
    }
    logger.debug(`Cache miss for compatibility score: ${userA.id}-${userB.id}. Calculating.`);

    let totalScore = 0;
    const breakdown: Record<string, number> = {};
    const MAX_SCORE_PER_CATEGORY = 1.0; // Max contribution per category before weighting

    // --- Weights (Configurable later) ---
    const weights = {
      dealbreakers: 1.0, // Acts as a filter primarily
      datingPreferences: 0.2,
      values: 0.3,
      interests: 0.2,
      communication: 0.15,
      physical: 0.15,
    };
    let totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0) - weights.dealbreakers; // Exclude dealbreaker weight from normalization base

    // --- 1. Dealbreaker Check ---
    // Check if userB violates any of userA's dealbreakers
    const userADealbreakers = userA.dealbreakers?.dealbreakers as { name: string, category: string }[] | undefined;
    let dealbreakerHit = false;

    if (userADealbreakers && userADealbreakers.length > 0) {
      const userBAge = calculateAge(userB.birthday);
      const userBValues = new Set((userB.values?.values as { name: string }[] || []).map(v => v.name));
      const userBInterests = new Set((userB.interests?.interests as { name: string }[] || []).map(i => i.name));
      // TODO: Add other relevant userB attributes here (e.g., smoking status, children preference) when schema supports them

      for (const dbk of userADealbreakers) {
        switch (dbk.category) {
          case 'age_min':
            if (userBAge !== null && userBAge < parseInt(dbk.name, 10)) {
              dealbreakerHit = true;
            }
            break;
          case 'age_max':
            if (userBAge !== null && userBAge > parseInt(dbk.name, 10)) {
              dealbreakerHit = true;
            }
            break;
          case 'gender':
            if (userB.gender === dbk.name) {
              dealbreakerHit = true;
            }
            break;
          case 'value': // Assumes dealbreaker means "must NOT have this value"
            if (userBValues.has(dbk.name)) {
              dealbreakerHit = true;
            }
            break;
          case 'interest': // Assumes dealbreaker means "must NOT have this interest"
            if (userBInterests.has(dbk.name)) {
              dealbreakerHit = true;
            }
            break;
          // TODO: Add cases for distance, smoking, children, etc.
          // case 'distance_max':
          //   // Requires location calculation
          //   break;
          // case 'smoking_status':
          //   // Requires userB.smokingStatus field
          //   break;
          // case 'children_preference':
          //   // Requires userB.childrenPreference field
          //   break;
          default:
            logger.warn(`Unknown dealbreaker category encountered: ${dbk.category}`);
        }
        if (dealbreakerHit) break; // Stop checking if one is hit
      }
    }

    if (dealbreakerHit) {
      logger.info(`Dealbreaker hit between user ${userA.id} and candidate ${userB.id}.`);
      breakdown['dealbreakers'] = 0;
      return { score: 0, breakdown }; // Return score 0 immediately
    }
    breakdown['dealbreakers'] = 1.0; // Passed check (or no dealbreakers defined)


    // --- 2. Dating Preferences Match (Basic: Age/Gender already filtered, focus on reciprocity) ---
    let prefScore = 0;
    // Calculate userA's age here
    const userAAge = calculateAge(userA.birthday);
    // userA's age is checked against userB's preferences
    // Add null checks for safety
    if (userAAge && userB.datingPreferences) {
        const meetsAgePref = (!userB.datingPreferences.minAge || userAAge >= userB.datingPreferences.minAge) &&
                             (!userB.datingPreferences.maxAge || userAAge <= userB.datingPreferences.maxAge);
        // userA's gender is checked against userB's preferences
        const meetsGenderPref = !userB.datingPreferences.genderPreference || userB.datingPreferences.genderPreference === 'any' || userB.datingPreferences.genderPreference === userA.gender;

        if (meetsAgePref && meetsGenderPref) {
            prefScore = MAX_SCORE_PER_CATEGORY; // Simple pass/fail for reciprocity
        }
        // TODO: Add distance score when location is available
    }
    breakdown['datingPreferences'] = prefScore;
    totalScore += prefScore * weights.datingPreferences;


    // --- 3. Core Values Similarity ---
    let valueScore = 0;
    // Use correct relation name 'values' and add null checks
    if (userA.values?.values && userB.values?.values) {
      // Assuming 'values' is an array of objects like { name: string, ... }
      const valuesA = new Set((userA.values.values as { name: string }[] || []).map(v => v.name));
      const valuesB = new Set((userB.values.values as { name: string }[] || []).map(v => v.name));
      valueScore = calculateJaccardIndex(valuesA, valuesB) * MAX_SCORE_PER_CATEGORY;
    }
    breakdown['values'] = valueScore;
    totalScore += valueScore * weights.values;


    // --- 4. Interests Overlap ---
    let interestScore = 0;
    // Use correct relation name 'interests' and add null checks
    if (userA.interests?.interests && userB.interests?.interests) {
      // Assuming 'interests' is an array of objects like { name: string, ... }
      const interestsA = new Set((userA.interests.interests as { name: string }[] || []).map(i => i.name));
      const interestsB = new Set((userB.interests.interests as { name: string }[] || []).map(i => i.name));
      interestScore = calculateJaccardIndex(interestsA, interestsB) * MAX_SCORE_PER_CATEGORY;
    }
    breakdown['interests'] = interestScore;
    totalScore += interestScore * weights.interests;


    // --- 5. Communication Style Compatibility (Using AI) ---
    let commScore = 0; // Default score if AI fails or data is missing
    // Use correct relation name 'communicationStyle' and add null checks
    if (userA.communicationStyle?.styles && userB.communicationStyle?.styles) {
        try {
          const featureKey: KnownFeatureKey = 'match_comm_style';
          const provider = await aiService.getProviderForFeature(featureKey);
          const model = await aiService.getModelForFeature(featureKey);

          // Construct a clear prompt for the AI
          const prompt = `Evaluate the communication style compatibility between two users based on the following metrics. User A: ${JSON.stringify(userA.communicationStyle.styles)}. User B: ${JSON.stringify(userB.communicationStyle.styles)}. Consider factors like directness, expressiveness, listening style, etc. Respond ONLY with a valid JSON object containing a single key "compatibilityScore" representing the compatibility as a numerical value between 0.0 (not compatible) and 1.0 (highly compatible). Example: {"compatibilityScore": 0.75}`;

          logger.debug(`AI Comm Style Prompt for users ${userA.id}/${userB.id}: ${prompt}`); // Log prompt if needed

          const result = await provider.generateChatCompletion([{ role: 'user', content: prompt }], { model });

          logger.debug(`AI Comm Style Result for users ${userA.id}/${userB.id}: ${result.content}`); // Log result

          // Safely parse the JSON response
          let parsedResult: { compatibilityScore?: number } = {};
          try {
             // Attempt to extract JSON even if surrounded by other text/markdown
             if (result.content) { // Add null check here
               const jsonMatch = result.content.match(/\{.*\}/s);
               if (jsonMatch && jsonMatch[0]) {
                  parsedResult = JSON.parse(jsonMatch[0]);
               } else {
                  logger.warn(`AI communication style response for users ${userA.id}/${userB.id} did not contain valid JSON: ${result.content}`);
               }
             } else {
                logger.warn(`AI communication style response for users ${userA.id}/${userB.id} was null or empty.`);
             }
          } catch (parseError) {
             logger.error(`Failed to parse AI communication style JSON response for users ${userA.id}/${userB.id}: ${parseError}\nResponse: ${result.content ?? '[NULL]'}`); // Log null explicitly
          }


          if (typeof parsedResult.compatibilityScore === 'number' && !isNaN(parsedResult.compatibilityScore)) {
            commScore = Math.max(0, Math.min(1, parsedResult.compatibilityScore)) * MAX_SCORE_PER_CATEGORY; // Clamp between 0 and 1
          } else {
             logger.warn(`AI communication style response for users ${userA.id}/${userB.id} lacked a valid 'compatibilityScore' number.`);
          }

        } catch (error) {
          logger.error(`AI communication style comparison failed for users ${userA.id} and ${userB.id}:`, error);
          // Keep default score (0) on error
        }
    } else {
        logger.warn(`Skipping AI communication style comparison for users ${userA.id}/${userB.id} due to missing style data.`);
    }
    breakdown['communication'] = commScore;
    totalScore += commScore * weights.communication;


    // --- 6. Physical Preferences Alignment (Using AI) ---
    let physicalScore = 0; // Default score
    const userAPhysicalPrefs = userA.physicalPreferences?.preferences;
    const userBPhotos = userB.photos?.filter((p: PhotoSelectType) => p.url).map((p: PhotoSelectType) => p.url); // Get valid photo URLs with explicit type

    if (userAPhysicalPrefs && userBPhotos && userBPhotos.length > 0) {
        try {
          const featureKey: KnownFeatureKey = 'match_physical_preference';
          const provider = await aiService.getProviderForFeature(featureKey);
          const model = await aiService.getModelForFeature(featureKey);

          // Construct prompt - using text completion for now.
          // TODO: Ideally, use multi-modal analysis if provider supports it (e.g., provider.analyzeImage)
          const prompt = `Evaluate how well User B's likely appearance, represented conceptually by their photos (URLs provided for context: ${JSON.stringify(userBPhotos)}), aligns with User A's stated physical preferences: ${JSON.stringify(userAPhysicalPrefs)}. Respond ONLY with a valid JSON object containing a single key "alignmentScore" representing the alignment as a numerical value between 0.0 (no alignment) and 1.0 (strong alignment). Example: {"alignmentScore": 0.6}`;

          logger.debug(`AI Physical Pref Prompt for users ${userA.id}/${userB.id}: ${prompt}`);

          const result = await provider.generateChatCompletion([{ role: 'user', content: prompt }], { model });

          logger.debug(`AI Physical Pref Result for users ${userA.id}/${userB.id}: ${result.content}`);

          // Safely parse the JSON response
          let parsedResult: { alignmentScore?: number } = {};
           try {
             if (result.content) {
               const jsonMatch = result.content.match(/\{.*\}/s);
               if (jsonMatch && jsonMatch[0]) {
                  parsedResult = JSON.parse(jsonMatch[0]);
               } else {
                  logger.warn(`AI physical preference response for users ${userA.id}/${userB.id} did not contain valid JSON: ${result.content}`);
               }
             } else {
                logger.warn(`AI physical preference response for users ${userA.id}/${userB.id} was null or empty.`);
             }
          } catch (parseError) {
             logger.error(`Failed to parse AI physical preference JSON response for users ${userA.id}/${userB.id}: ${parseError}\nResponse: ${result.content ?? '[NULL]'}`);
          }

          if (typeof parsedResult.alignmentScore === 'number' && !isNaN(parsedResult.alignmentScore)) {
            physicalScore = Math.max(0, Math.min(1, parsedResult.alignmentScore)) * MAX_SCORE_PER_CATEGORY; // Clamp 0-1
          } else {
             logger.warn(`AI physical preference response for users ${userA.id}/${userB.id} lacked a valid 'alignmentScore' number.`);
          }

        } catch (error) {
          logger.error(`AI physical preference analysis failed for users ${userA.id} and ${userB.id}:`, error);
          // Keep default score (0) on error
        }
    } else {
         logger.warn(`Skipping AI physical preference analysis for users ${userA.id}/${userB.id} due to missing preferences or photos.`);
    }
    breakdown['physical'] = physicalScore;
    totalScore += physicalScore * weights.physical;


    // --- Final Score Normalization ---
    // Normalize based on the total weight applied (excluding dealbreakers)
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    const result = {
        score: Math.min(1, Math.max(0, finalScore)), // Clamp score between 0 and 1
        breakdown
    };

    // --- Store result in cache ---
    try {
        await this.redis.set(cacheKey, JSON.stringify(result), 'EX', COMPATIBILITY_CACHE_TTL_SECONDS);
        logger.debug(`Stored compatibility score in cache: ${userA.id}-${userB.id}`);
    } catch (error) {
        logger.error(`Redis SET error for compatibility key ${cacheKey}:`, error);
        // Return calculated result even if caching fails
    }

    return result;
  }

  // TODO: Add methods for recording swipes (likes/dislikes)
  // TODO: Add method for creating a match record when mutual like occurs
}

// Export a singleton instance or use dependency injection
// Ensure Redis client is available before creating the service instance
if (!redisClient) {
  throw new Error('Redis client is not available. MatchingService requires a Redis connection.');
}
export const matchingService = new MatchingService(redisClient); // Pass Redis client instance