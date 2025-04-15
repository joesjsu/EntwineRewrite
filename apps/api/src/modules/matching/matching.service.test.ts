import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import Redis from 'ioredis-mock'; // Import the default export (constructor and type)
import { MatchingService } from './matching.service'; // Import only the class, not the singleton
// import { db } from '../../db'; // No longer mocking db
import { aiService } from '../../ai/ai.service'; // Assuming aiService is exported
import { seedUser, seedDatingPreferences, seedMatch, clearDatabase } from '../../test-utils/seed'; // Import seeding utilities
// import { users, datingPreferences, matches } from '../../db/schema'; // Removed schema import as it's causing issues and types are inferred
import { db } from '../../db'; // Import the actual db instance
// DB is no longer mocked
jest.mock('../../ai/ai.service', () => ({
  aiService: {
    getProviderForFeature: jest.fn(),
    getModelForFeature: jest.fn(),
  },
  KnownFeatureKey: { // Mock enum values if needed, or import directly if simple
        match_comm_style: 'match_comm_style',
        match_physical_preference: 'match_physical_preference',
  }
}));

// Mock logger (using console for simplicity in tests, or a more sophisticated mock)
const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(), // Add debug if used
};
// You might need to mock the logger import if it's not console
// jest.mock('../../config/logger', () => ({ logger }));


describe('MatchingService', () => {
  let service: MatchingService;
  // let mockDb: any; // No longer using mockDb
  let mockAiService: any; // Type properly if possible
  let mockRedis: InstanceType<typeof Redis>; // Correct type for Redis instance

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockRedis = new Redis(); // Use the default export constructor
    mockRedis.flushall(); // Clear Redis cache before each test

    // mockDb = db; // No longer needed
    mockAiService = aiService;

    // Mock the AI provider methods if needed for specific tests
    mockAiService.getProviderForFeature.mockResolvedValue({
        generateChatCompletion: jest.fn<() => Promise<{ content: string | null }>>().mockResolvedValue({ content: '{"compatibilityScore": 0.5}' }), // Default mock response with typed jest.fn
        analyzeImage: jest.fn(), // Mock if used
        countTokens: jest.fn(), // Mock if used
    });
    mockAiService.getModelForFeature.mockResolvedValue('mock-model');


    // Instantiate the service (or use the singleton instance)
    // If using the singleton, ensure its state is clean or re-instantiate if necessary
    // mockRedis is now instantiated and flushed above
    service = new MatchingService(mockRedis); // Pass mock Redis to constructor

    // NOTE: calculateCompatibility mock is now applied *only* within the findPotentialMatches describe block

     // Inject mock logger if the service uses it internally and it's not globally mocked/replaced
     // (This depends on how logger is implemented/injected in the actual service)
     // For example, if logger was a property: (service as any).logger = logger;
     // Since the service currently uses `const logger = console`, this step might not be needed
     // unless we refactor the service to inject the logger. For now, console calls won't be asserted against.

  });

  // Clean the database after each test
  afterEach(async () => {
    await clearDatabase();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test cases for findPotentialMatches ---
  describe('findPotentialMatches', () => {
    // Mock calculateCompatibility specifically for these tests to focus on filtering/sorting
    beforeEach(() => {
      jest.spyOn(service as any, 'calculateCompatibility').mockImplementation(async (userA, userB) => {
        const typedUserB = userB as { id: number }; // Cast inside
        // Simple mock: return a score based on user ID or a fixed value
        return { score: 1 - (typedUserB.id / 100), breakdown: {} }; // Higher score for lower IDs
      });
    });

    // Restore the original implementation after these tests
    afterEach(() => {
        jest.restoreAllMocks(); // Restore all mocks, including the calculateCompatibility spy
    });

    // These tests focus on filtering/sorting based on the *mocked* score above
    it('should return an empty array if the target user is not found', async () => {
        // No seeding needed, user 1 should not exist
        const result = await service.findPotentialMatches(1);
        expect(result).toEqual([]);
    });

    it('should return an empty array if the target user has no dating preferences', async () => {
        await seedUser({ id: 1, email: 'user1@test.com', gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 } });
        // No preferences seeded for user 1
        const result = await service.findPotentialMatches(1);
        expect(result).toEqual([]);
    });

     it('should return an empty array if no candidates are found after initial filtering', async () => {
        // Seed target user with preferences
        await seedUser({ id: 1, email: 'user1@test.com', gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 } });
        await seedDatingPreferences({ userId: 1, genderPreference: 'male', minAge: 28, maxAge: 35, maxDistance: 50 });
        // No other users seeded

        const result = await service.findPotentialMatches(1);
        expect(result).toEqual([]);
    });

    it('should filter candidates by gender preference', async () => {
        // Seed target user (female, likes male)
        await seedUser({ id: 1, email: 'user1@test.com', gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 } });
        await seedDatingPreferences({ userId: 1, genderPreference: 'male', minAge: 25, maxAge: 35, maxDistance: 50 });
        // Seed candidates
        await seedUser({ id: 2, email: 'user2@test.com', gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Match
        await seedUser({ id: 3, email: 'user3@test.com', gender: 'female', birthday: new Date('1993-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Wrong gender

        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(2);
        // calculateCompatibility mock returns score based on ID, so call check is less relevant here
    });

    it('should filter candidates by age preference', async () => {
        // Seed target user (female, birthday 1990-01-01 -> ~35y old in 2025, likes 30-35)
        await seedUser({ id: 1, email: 'user1@test.com', gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 } });
        await seedDatingPreferences({ userId: 1, genderPreference: 'male', minAge: 30, maxAge: 35, maxDistance: 50 });
        // Seed candidates
        await seedUser({ id: 2, email: 'user2@test.com', gender: 'male', birthday: new Date('1996-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Too young (~29)
        await seedUser({ id: 3, email: 'user3@test.com', gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Match (~33)
        await seedUser({ id: 4, email: 'user4@test.com', gender: 'male', birthday: new Date('1988-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Too old (~37)

        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(3);
    });

     it('should filter candidates by distance', async () => {
        // Seed target user (NYC, likes < 50km)
        await seedUser({ id: 1, email: 'user1@test.com', gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 40.7128, lon: -74.0060 } }); // NYC
        await seedDatingPreferences({ userId: 1, genderPreference: 'male', minAge: 25, maxAge: 40, maxDistance: 50 }); // 50 km max distance
        // Seed candidates
        await seedUser({ id: 2, email: 'user2@test.com', gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 40.7580, lon: -73.9855 }, profileComplete: true }); // Near NYC (~5km) - Match
        await seedUser({ id: 3, email: 'user3@test.com', gender: 'male', birthday: new Date('1993-01-01'), location: { lat: 34.0522, lon: -118.2437 }, profileComplete: true }); // Los Angeles - Too Far
        await seedUser({ id: 4, email: 'user4@test.com', gender: 'male', birthday: new Date('1991-01-01'), location: null, profileComplete: true }); // No location - Skip

        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(2);
    });

     it('should exclude the user themselves from potential matches', async () => {
        // Seed target user
        await seedUser({ id: 1, email: 'user1@test.com', gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 } });
        await seedDatingPreferences({ userId: 1, genderPreference: 'male', minAge: 25, maxAge: 35, maxDistance: 50 });
        // Seed potential match
        await seedUser({ id: 2, email: 'user2@test.com', gender: 'male', birthday: new Date('1993-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Match

        // The service's internal query should exclude user 1, but the filter logic is also tested
        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(2);
    });

     it('should exclude users already matched or declined', async () => {
        // Seed target user
        await seedUser({ id: 1, email: 'user1@test.com', gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 } });
        await seedDatingPreferences({ userId: 1, genderPreference: 'male', minAge: 25, maxAge: 35, maxDistance: 50 });
        // Seed candidates
        await seedUser({ id: 2, email: 'user2@test.com', gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Potential Match
        await seedUser({ id: 3, email: 'user3@test.com', gender: 'male', birthday: new Date('1993-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // To be matched
        await seedUser({ id: 4, email: 'user4@test.com', gender: 'male', birthday: new Date('1991-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // To be matched
        // Seed existing matches/declines for user 1 (Removing status properties as they are not valid)
        await seedMatch({ user1Id: 1, user2Id: 3 }); // Assume seed handles status or it's not needed here
        await seedMatch({ user1Id: 1, user2Id: 4 }); // Assume seed handles status or it's not needed here

        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(2);
    });

    it('should sort results by compatibility score (descending)', async () => {
        // Seed target user
        await seedUser({ id: 1, email: 'user1@test.com', gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 } });
        await seedDatingPreferences({ userId: 1, genderPreference: 'male', minAge: 25, maxAge: 35, maxDistance: 50 });
        // Seed candidates (IDs determine mock score: score = 1 - id/100)
        await seedUser({ id: 4, email: 'user4@test.com', gender: 'male', birthday: new Date('1991-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Score 0.96
        await seedUser({ id: 2, email: 'user2@test.com', gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Score 0.98
        await seedUser({ id: 3, email: 'user3@test.com', gender: 'male', birthday: new Date('1993-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Score 0.97

        // calculateCompatibility is mocked in beforeEach to return score = 1 - (id / 100)
        // Expected order: ID 2 (0.98), ID 3 (0.97), ID 4 (0.96)
        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(3);
        expect(result.map(u => u.id)).toEqual([2, 3, 4]);
    });

     it('should apply the limit to the results', async () => {
        // Seed target user
        await seedUser({ id: 1, email: 'user1@test.com', gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 } });
        await seedDatingPreferences({ userId: 1, genderPreference: 'male', minAge: 25, maxAge: 35, maxDistance: 50 });
        // Seed candidates (IDs determine mock score: score = 1 - id/100)
        await seedUser({ id: 4, email: 'user4@test.com', gender: 'male', birthday: new Date('1991-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Score 0.96
        await seedUser({ id: 2, email: 'user2@test.com', gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Score 0.98
        await seedUser({ id: 3, email: 'user3@test.com', gender: 'male', birthday: new Date('1993-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Score 0.97
        await seedUser({ id: 5, email: 'user5@test.com', gender: 'male', birthday: new Date('1990-01-01'), location: { lat: 10.1, lon: 10.1 }, profileComplete: true }); // Score 0.95

        const limit = 2;
        // Expected result based on mock score: ID 2 (0.98), ID 3 (0.97)
        const result = await service.findPotentialMatches(1, limit);
        expect(result).toHaveLength(limit);
        expect(result.map(u => u.id)).toEqual([2, 3]);
    });

    // TODO: Add more tests for findPotentialMatches:
    // - Correctly calling calculateCompatibility for candidates (covered implicitly above, but maybe add explicit spy check)
    // - Handling candidates without location when distance filter is active (covered in distance test)
  });


  // --- Test cases for calculateCompatibility ---
  describe('calculateCompatibility', () => {
    // Define mock user data here
    const mockUserA: any = { // Use a more specific type based on UserWithProfileData
        id: 1,
        birthday: new Date('1990-05-15'),
        gender: 'female',
        location: { lat: 40.7128, lon: -74.0060 }, // NYC
        datingPreferences: { userId: 1, genderPreference: 'male', minAge: 30, maxAge: 40, maxDistance: 100 },
        dealbreakers: { userId: 1, dealbreakers: [{ category: 'smoking_status', name: 'regularly' }] }, // Example dealbreaker
        values: { userId: 1, values: [{ name: 'Family' }, { name: 'Honesty' }] },
        interests: { userId: 1, interests: [{ name: 'Hiking' }, { name: 'Reading' }] },
        communicationStyle: { userId: 1, styles: { directness: 0.7, expressiveness: 0.6 } },
        physicalPreferences: { userId: 1, preferences: { hairColor: 'dark', build: 'athletic' } },
        photos: [{ id: 1, userId: 1, url: 'url1', isPrimary: true, order: 0, createdAt: new Date() }],
    };

    const mockUserB_Compatible: any = {
        id: 2,
        birthday: new Date('1988-08-20'), // Age 36 (within A's range)
        gender: 'male', // Matches A's preference
        location: { lat: 40.7580, lon: -73.9855 }, // Near NYC (within 100km)
        datingPreferences: { userId: 2, genderPreference: 'female', minAge: 28, maxAge: 38 }, // A is within B's range
        dealbreakers: { userId: 2, dealbreakers: [] }, // No dealbreakers for A
        values: { userId: 2, values: [{ name: 'Honesty' }, { name: 'Adventure' }] }, // Some overlap
        interests: { userId: 2, interests: [{ name: 'Hiking' }, { name: 'Travel' }] }, // Some overlap
        communicationStyle: { userId: 2, styles: { directness: 0.6, expressiveness: 0.7 } },
        physicalPreferences: { userId: 2, preferences: {} }, // Not relevant for A scoring B
        photos: [{ id: 2, userId: 2, url: 'url2', isPrimary: true, order: 0, createdAt: new Date() }],
        // Assume smoking_status is not 'regularly'
    };

     // Define test users with only necessary differing fields for clarity
     const mockUserB_Dealbreaker: any = {
        id: 3,
        birthday: new Date('1988-08-20'),
        gender: 'male',
        location: { lat: 40.7580, lon: -73.9855 },
        datingPreferences: { userId: 3, genderPreference: 'female', minAge: 28, maxAge: 38 },
        dealbreakers: { userId: 3, dealbreakers: [] },
        values: { userId: 3, values: [{ name: 'Adventure' }] }, // This will trigger User A's dealbreaker in the test below
        interests: { userId: 3, interests: [] },
        communicationStyle: { userId: 3, styles: {} },
        physicalPreferences: { userId: 3, preferences: {} },
        photos: [{ id: 3, userId: 3, url: 'url3', isPrimary: true, order: 0, createdAt: new Date() }],
     };

     const mockUserB_WrongGender: any = {
        id: 4,
        birthday: new Date('1988-08-20'),
        gender: 'female', // Different gender
        location: { lat: 40.7580, lon: -73.9855 },
        datingPreferences: { userId: 4, genderPreference: 'female', minAge: 28, maxAge: 38 },
        dealbreakers: { userId: 4, dealbreakers: [] },
        values: { userId: 4, values: [] },
        interests: { userId: 4, interests: [] },
        communicationStyle: { userId: 4, styles: {} },
        physicalPreferences: { userId: 4, preferences: {} },
        photos: [{ id: 4, userId: 4, url: 'url4', isPrimary: true, order: 0, createdAt: new Date() }],
     };

     const mockUserB_TooOld: any = {
        id: 5,
        birthday: new Date('1980-01-01'), // Too old
        gender: 'male',
        location: { lat: 40.7580, lon: -73.9855 },
        datingPreferences: { userId: 5, genderPreference: 'female', minAge: 28, maxAge: 38 },
        dealbreakers: { userId: 5, dealbreakers: [] },
        values: { userId: 5, values: [] },
        interests: { userId: 5, interests: [] },
        communicationStyle: { userId: 5, styles: {} },
        physicalPreferences: { userId: 5, preferences: {} },
        photos: [{ id: 5, userId: 5, url: 'url5', isPrimary: true, order: 0, createdAt: new Date() }],
     };

     const mockUserB_TooFar: any = {
        id: 6,
        birthday: new Date('1988-08-20'),
        gender: 'male',
        location: { lat: 34.0522, lon: -118.2437 }, // Too far
        datingPreferences: { userId: 6, genderPreference: 'female', minAge: 28, maxAge: 38 },
        dealbreakers: { userId: 6, dealbreakers: [] },
        values: { userId: 6, values: [] },
        interests: { userId: 6, interests: [] },
        communicationStyle: { userId: 6, styles: {} },
        physicalPreferences: { userId: 6, preferences: {} },
        photos: [{ id: 6, userId: 6, url: 'url6', isPrimary: true, order: 0, createdAt: new Date() }],
     };


    it('should return score 0 if a dealbreaker is hit', async () => {
        // Modify mockUserA or mockUserB_Dealbreaker to ensure a dealbreaker condition is met
        // For example, let's assume 'value' dealbreaker: "Must NOT have value 'Adventure'"
         const userAWithDealbreaker = {
            ...mockUserA,
            dealbreakers: { userId: 1, dealbreakers: [{ category: 'value', name: 'Adventure' }] }
         };
        const { score, breakdown } = await (service as any).calculateCompatibility(userAWithDealbreaker, mockUserB_Compatible); // User B has 'Adventure'
        expect(score).toBe(0);
        expect(breakdown['dealbreakers']).toBe(0);
    });

    it('should calculate a non-zero score for compatible users', async () => {
         // Mock AI responses for this specific test
         // Access the mock function set up in beforeEach and chain mockResolvedValueOnce
         const mockGenerateFn = (await mockAiService.getProviderForFeature()).generateChatCompletion as jest.MockedFunction<any>;
         mockGenerateFn
            .mockResolvedValueOnce({ content: '{"compatibilityScore": 0.8}' }) // Comm style
            .mockResolvedValueOnce({ content: '{"alignmentScore": 0.7}' }); // Physical pref

        const { score, breakdown } = await (service as any).calculateCompatibility(mockUserA, mockUserB_Compatible);
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(1);
        expect(breakdown['dealbreakers']).toBe(1.0);
        expect(breakdown['datingPreferences']).toBeGreaterThan(0); // Should pass reciprocity
        expect(breakdown['values']).toBeGreaterThan(0); // Jaccard should be > 0
        expect(breakdown['interests']).toBeGreaterThan(0); // Jaccard should be > 0
        expect(breakdown['communication']).toBeCloseTo(0.8); // Based on mocked AI
        expect(breakdown['physical']).toBeCloseTo(0.7); // Based on mocked AI
    });

    it('should return score 0 if reciprocity check fails (A does not meet B preferences)', async () => {
        const userB_PrefsNotMetByA = {
            ...mockUserB_Compatible,
            datingPreferences: { userId: 2, genderPreference: 'female', minAge: 40, maxAge: 50, maxDistance: 100 }, // User A (age 34) is too young
        };
        // Reset the calculateCompatibility spy for this specific test if needed, or ensure it's not called due to early exit
        const calculateCompatibilitySpy = jest.spyOn(service as any, 'calculateCompatibility');
        const { score, breakdown } = await (service as any).calculateCompatibility(mockUserA, userB_PrefsNotMetByA);
        expect(score).toBe(0);
        expect(breakdown['datingPreferences']).toBe(0); // Reciprocity check fails
        calculateCompatibilitySpy.mockRestore(); // Restore original implementation or mock after test
    });

    it('should calculate Jaccard index correctly for values (no overlap)', async () => {
        const userA_Values = { ...mockUserA, values: { userId: 1, values: [{ name: 'A' }, { name: 'B' }] } };
        const userB_Values = { ...mockUserB_Compatible, values: { userId: 2, values: [{ name: 'C' }, { name: 'D' }] } };
        const { breakdown } = await (service as any).calculateCompatibility(userA_Values, userB_Values);
        expect(breakdown['values']).toBe(0); // Jaccard index = 0 / 4 = 0
    });

    it('should calculate Jaccard index correctly for values (partial overlap)', async () => {
        const userA_Values = { ...mockUserA, values: { userId: 1, values: [{ name: 'A' }, { name: 'B' }] } };
        const userB_Values = { ...mockUserB_Compatible, values: { userId: 2, values: [{ name: 'B' }, { name: 'C' }] } };
        const { breakdown } = await (service as any).calculateCompatibility(userA_Values, userB_Values);
        expect(breakdown['values']).toBeCloseTo(1 / 3); // Jaccard index = 1 / 3
    });

     it('should calculate Jaccard index correctly for values (full overlap)', async () => {
        const userA_Values = { ...mockUserA, values: { userId: 1, values: [{ name: 'A' }, { name: 'B' }] } };
        const userB_Values = { ...mockUserB_Compatible, values: { userId: 2, values: [{ name: 'A' }, { name: 'B' }] } };
        const { breakdown } = await (service as any).calculateCompatibility(userA_Values, userB_Values);
        expect(breakdown['values']).toBe(1); // Jaccard index = 2 / 2 = 1
    });

     it('should calculate Jaccard index correctly for interests (partial overlap)', async () => {
        const userA_Interests = { ...mockUserA, interests: { userId: 1, interests: [{ name: 'Hiking' }, { name: 'Movies' }] } };
        const userB_Interests = { ...mockUserB_Compatible, interests: { userId: 2, interests: [{ name: 'Hiking' }, { name: 'Travel' }] } };
        const { breakdown } = await (service as any).calculateCompatibility(userA_Interests, userB_Interests);
        expect(breakdown['interests']).toBeCloseTo(1 / 3); // Jaccard index = 1 / 3
    });

     it('should handle empty values/interests sets gracefully in Jaccard calculation', async () => {
        const userA_NoInterests = { ...mockUserA, interests: { userId: 1, interests: [] } };
        const userB_NoInterests = { ...mockUserB_Compatible, interests: { userId: 2, interests: [] } };
        const { breakdown } = await (service as any).calculateCompatibility(userA_NoInterests, userB_NoInterests);
        expect(breakdown['interests']).toBe(0); // Jaccard index = 0 / 0 = 0 (handle division by zero)

        // Define minimal user data specifically for the empty values check, avoiding base mocks
        const userA_MinimalEmptyValues: any = {
            id: 11, // Use different IDs to avoid potential cache collisions if flushall wasn't perfect
            values: { userId: 11, values: [] },
            // Include minimal data needed to pass prior checks (dealbreakers, reciprocity)
            birthday: new Date('1990-01-01'),
            gender: 'female',
            datingPreferences: { userId: 11, genderPreference: 'male', minAge: 30, maxAge: 40 },
            dealbreakers: { userId: 11, dealbreakers: [] },
            // Add dummy data for other potentially accessed properties to avoid null errors
             interests: { userId: 11, interests: [] },
             communicationStyle: { userId: 11, styles: {} },
             physicalPreferences: { userId: 11, preferences: {} },
             photos: [],
        };
         const userB_MinimalOneValue: any = {
            id: 12,
            values: { userId: 12, values: [{ name: 'A' }] },
            // Include minimal data needed to pass prior checks
            birthday: new Date('1988-01-01'),
            gender: 'male',
            datingPreferences: { userId: 12, genderPreference: 'female', minAge: 28, maxAge: 38 }, // A meets B's prefs
            dealbreakers: { userId: 12, dealbreakers: [] },
            // Add dummy data
             interests: { userId: 12, interests: [] },
             communicationStyle: { userId: 12, styles: {} },
             physicalPreferences: { userId: 12, preferences: {} },
             photos: [],
        };

        const { breakdown: breakdown2 } = await (service as any).calculateCompatibility(userA_MinimalEmptyValues, userB_MinimalOneValue);
        expect(breakdown2['values']).toBe(0); // Jaccard index = 0 / 1 = 0
    });

    it('should handle AI errors gracefully for communication score (defaulting to 0)', async () => {
        // Mock AI call to throw an error for communication style
        const mockGenerateFn = (await mockAiService.getProviderForFeature()).generateChatCompletion as jest.MockedFunction<any>;
        mockGenerateFn
            .mockRejectedValueOnce(new Error("AI communication API failed")) // Error for comm style
            .mockResolvedValueOnce({ content: '{"alignmentScore": 0.7}' }); // Success for physical pref

        const { score, breakdown } = await (service as any).calculateCompatibility(mockUserA, mockUserB_Compatible);
        expect(breakdown['communication']).toBe(0); // Should default to 0 on error
        expect(breakdown['physical']).toBeCloseTo(0.7); // Physical should still be calculated
        expect(score).toBeGreaterThan(0); // Overall score should still be calculated based on other factors
    });

    it('should handle AI errors gracefully for physical preference score (defaulting to 0)', async () => {
        // Mock AI call to throw an error for physical preference
        const mockGenerateFn = (await mockAiService.getProviderForFeature()).generateChatCompletion as jest.MockedFunction<any>;
        mockGenerateFn
            .mockResolvedValueOnce({ content: '{"compatibilityScore": 0.8}' }) // Success for comm style
            .mockRejectedValueOnce(new Error("AI physical API failed")); // Error for physical pref

        const { score, breakdown } = await (service as any).calculateCompatibility(mockUserA, mockUserB_Compatible);
        expect(breakdown['communication']).toBeCloseTo(0.8); // Communication should be calculated
        expect(breakdown['physical']).toBe(0); // Should default to 0 on error
        expect(score).toBeGreaterThan(0);
    });

     it('should handle missing communicationStyle data (defaulting score to 0)', async () => {
        const userA_NoCommStyle = { ...mockUserA, communicationStyle: null };
        const userB_NoCommStyle = { ...mockUserB_Compatible, communicationStyle: null };

        // Test missing on user A
        const { breakdown: breakdownA } = await (service as any).calculateCompatibility(userA_NoCommStyle, mockUserB_Compatible);
        expect(breakdownA['communication']).toBe(0);

        // Test missing on user B
        const { breakdown: breakdownB } = await (service as any).calculateCompatibility(mockUserA, userB_NoCommStyle);
        expect(breakdownB['communication']).toBe(0);
    });

     it('should handle missing physicalPreferences or photos data (defaulting score to 0)', async () => {
        const userA_NoPhysicalPrefs = { ...mockUserA, physicalPreferences: null };
        const userA_NoPhotos = { ...mockUserA, photos: [] };
        const userB_NoPhotos = { ...mockUserB_Compatible, photos: [] };

        // Test missing physicalPreferences on user A
        const { breakdown: breakdownA } = await (service as any).calculateCompatibility(userA_NoPhysicalPrefs, mockUserB_Compatible);
        expect(breakdownA['physical']).toBe(0);

        // Test missing photos on user A
        const { breakdown: breakdownB } = await (service as any).calculateCompatibility(userA_NoPhotos, mockUserB_Compatible);
        expect(breakdownB['physical']).toBe(0);

         // Test missing photos on user B
        const { breakdown: breakdownC } = await (service as any).calculateCompatibility(mockUserA, userB_NoPhotos);
        expect(breakdownC['physical']).toBe(0);
    });


    it('should clamp individual scores and the final score between 0 and 1', async () => {
        // Mock AI to return scores outside the 0-1 range
        const mockGenerateFn = (await mockAiService.getProviderForFeature()).generateChatCompletion as jest.MockedFunction<any>;
        mockGenerateFn
            .mockResolvedValueOnce({ content: '{"compatibilityScore": 1.5}' }) // Comm style > 1
            .mockResolvedValueOnce({ content: '{"alignmentScore": -0.2}' }); // Physical pref < 0

        // Mock user data for high Jaccard scores
        const userA_HighOverlap = {
            ...mockUserA,
            values: { userId: 1, values: [{ name: 'A' }, { name: 'B' }] },
            interests: { userId: 1, interests: [{ name: 'X' }, { name: 'Y' }] },
        };
        const userB_HighOverlap = {
            ...mockUserB_Compatible,
            values: { userId: 2, values: [{ name: 'A' }, { name: 'B' }] }, // Jaccard = 1
            interests: { userId: 2, interests: [{ name: 'X' }, { name: 'Y' }] }, // Jaccard = 1
        };


        const { score, breakdown } = await (service as any).calculateCompatibility(userA_HighOverlap, userB_HighOverlap);

        // Check individual clamped scores in breakdown
        expect(breakdown['communication']).toBe(1); // Clamped from 1.5
        expect(breakdown['physical']).toBe(0); // Clamped from -0.2
        expect(breakdown['values']).toBe(1);
        expect(breakdown['interests']).toBe(1);
        expect(breakdown['datingPreferences']).toBe(1); // Assuming compatible prefs
        expect(breakdown['dealbreakers']).toBe(1); // Assuming no dealbreakers

        // Check final score is also clamped
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);

        // Verify the score is calculated based on the *clamped* values
        // Define weights locally in the test as they are not exposed by the service
        const testWeights = {
            dealbreakers: 1.0, // Not used in normalization base, but kept for clarity
            datingPreferences: 0.2,
            values: 0.3,
            interests: 0.2,
            communication: 0.15,
            physical: 0.15,
        };
        // Calculate total weight excluding dealbreakers for normalization
        const totalTestWeight = testWeights.datingPreferences + testWeights.values + testWeights.interests + testWeights.communication + testWeights.physical;

        const expectedScore = (
            (1 * testWeights.datingPreferences) + // breakdown['datingPreferences'] is 1
            (1 * testWeights.values) +            // breakdown['values'] is 1
            (1 * testWeights.interests) +         // breakdown['interests'] is 1
            (1 * testWeights.communication) +     // breakdown['communication'] clamped to 1
            (0 * testWeights.physical)            // breakdown['physical'] clamped to 0
        ) / totalTestWeight;
        expect(score).toBeCloseTo(expectedScore);
    });

     it('should apply weights correctly and normalize the final score', async () => {
        // Use default weights or mock specific weights if needed
        const weights = (service as any).weights;

        // Mock AI responses to give specific scores
        const mockGenerateFn = (await mockAiService.getProviderForFeature()).generateChatCompletion as jest.MockedFunction<any>;
        mockGenerateFn
            .mockResolvedValueOnce({ content: '{"compatibilityScore": 0.8}' }) // Comm style
            .mockResolvedValueOnce({ content: '{"alignmentScore": 0.6}' }); // Physical pref

        // Define the specific user data needed for this test directly
        const userA_ForWeightTest = {
            ...mockUserA,
            values: { userId: 1, values: [{ name: 'A' }, { name: 'B' }] }, // For expected Jaccard = 0.5
            interests: { userId: 1, interests: [{ name: 'X' }] }, // For expected Jaccard = 0
        };
        const userB_ForWeightTest = {
            ...mockUserB_Compatible,
            values: { userId: 2, values: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }] }, // For expected Jaccard = 0.5
            interests: { userId: 2, interests: [{ name: 'Y' }] }, // For expected Jaccard = 0
        };

        // Expected breakdown scores based on the data above and mocked AI
        const expectedBreakdown = {
            dealbreakers: 1.0,
            datingPreferences: 1.0, // Assuming compatible
            values: 0.5, // Jaccard = 2 / (2+4-2) = 0.5
            interests: 0.0, // Jaccard = 0 / (1+1-0) = 0
            communication: 0.8, // From mocked AI
            physical: 0.6, // From mocked AI
        };

        // Calculate with the specific data
        const { score: finalScore, breakdown: finalBreakdown } = await (service as any).calculateCompatibility(userA_ForWeightTest, userB_ForWeightTest);

        // Verify breakdown scores
        expect(finalBreakdown['dealbreakers']).toBe(expectedBreakdown.dealbreakers);
        expect(finalBreakdown['datingPreferences']).toBe(expectedBreakdown.datingPreferences);
        expect(finalBreakdown['values']).toBeCloseTo(expectedBreakdown.values);
        expect(finalBreakdown['interests']).toBeCloseTo(expectedBreakdown.interests);
        expect(finalBreakdown['communication']).toBeCloseTo(expectedBreakdown.communication);
        expect(finalBreakdown['physical']).toBeCloseTo(expectedBreakdown.physical);

        // Calculate expected weighted score using local weights
         const testWeights = {
            dealbreakers: 1.0,
            datingPreferences: 0.2,
            values: 0.3,
            interests: 0.2,
            communication: 0.15,
            physical: 0.15,
        };
        const totalTestWeight = testWeights.datingPreferences + testWeights.values + testWeights.interests + testWeights.communication + testWeights.physical;

        const totalWeightedScore = (
            // dealbreakers score (1.0) doesn't contribute to weighted average
            (expectedBreakdown.datingPreferences * testWeights.datingPreferences) +
            (expectedBreakdown.values * testWeights.values) +
            (expectedBreakdown.interests * testWeights.interests) +
            (expectedBreakdown.communication * testWeights.communication) +
            (expectedBreakdown.physical * testWeights.physical)
        );
        const expectedFinalScore = totalWeightedScore / totalTestWeight;

        expect(finalScore).toBeCloseTo(expectedFinalScore);
    });

    // TODO: Add more tests for calculateCompatibility:
    // [All items covered]
  });

});