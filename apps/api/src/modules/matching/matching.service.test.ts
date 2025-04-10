import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import Redis from 'ioredis-mock'; // Import the default export (constructor and type)
import { MatchingService } from './matching.service'; // Import only the class, not the singleton
import { db } from '../../db'; // Assuming db is exported from here
import { aiService } from '../../ai/ai.service'; // Assuming aiService is exported
// Mock the dependencies
jest.mock('../../db', () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    },
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    // Add other methods used by the service if necessary
  },
}));

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
  let mockDb: any; // Type properly if possible
  let mockAiService: any; // Type properly if possible
  let mockRedis: InstanceType<typeof Redis>; // Correct type for Redis instance

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Re-assign mocks in case they are needed directly in tests
    mockDb = db;
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
    mockRedis = new Redis(); // Use the default export constructor
    service = new MatchingService(mockRedis); // Pass mock Redis to constructor

    // Mock calculateCompatibility for tests focusing on findPotentialMatches filtering/sorting
    // Cast userB inside the implementation to access .id safely
    jest.spyOn(service as any, 'calculateCompatibility').mockImplementation(async (userA, userB) => {
        const typedUserB = userB as { id: number }; // Cast inside
        // Simple mock: return a score based on user ID or a fixed value
        return { score: 1 - (typedUserB.id / 100), breakdown: {} }; // Higher score for lower IDs
    });

     // Inject mock logger if the service uses it internally and it's not globally mocked/replaced
     // (This depends on how logger is implemented/injected in the actual service)
     // For example, if logger was a property: (service as any).logger = logger;
     // Since the service currently uses `const logger = console`, this step might not be needed
     // unless we refactor the service to inject the logger. For now, console calls won't be asserted against.

  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Test cases for findPotentialMatches ---
  describe('findPotentialMatches', () => {
    it('should return an empty array if the target user is not found', async () => {
        mockDb.query.users.findFirst.mockResolvedValue(null);
        const result = await service.findPotentialMatches(1);
        expect(result).toEqual([]);
        expect(mockDb.query.users.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object), with: expect.any(Object) })); // Check for 'with' and 'where' objects
    });

    it('should return an empty array if the target user has no dating preferences', async () => {
        mockDb.query.users.findFirst.mockResolvedValue({ id: 1 /* other user fields */, datingPreferences: null });
        const result = await service.findPotentialMatches(1);
        expect(result).toEqual([]);
    });

     it('should return an empty array if no candidates are found after initial filtering', async () => {
        // Mock target user fetch
        mockDb.query.users.findFirst.mockResolvedValue({
            id: 1,
            gender: 'female',
            birthday: new Date('1990-01-01'),
            location: { lat: 10, lon: 10 },
            datingPreferences: { userId: 1, genderPreference: 'male', minAge: 28, maxAge: 35, maxDistance: 50 },
            // ... other necessary fields
        });
        // Mock existing matches fetch
        (mockDb.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn<() => Promise<{ matchedUserId: number }[]>>().mockResolvedValue([]) }) }); // Typed jest.fn for where
        // Mock candidate fetch to return empty
        mockDb.query.users.findMany.mockResolvedValue([]);

        const result = await service.findPotentialMatches(1);
        expect(result).toEqual([]);
        expect(mockDb.query.users.findMany).toHaveBeenCalled();
    });

    it('should filter candidates by gender preference', async () => {
        mockDb.query.users.findFirst.mockResolvedValue({
            id: 1, gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 },
            datingPreferences: { userId: 1, genderPreference: 'male', minAge: 25, maxAge: 35, maxDistance: 50 },
        });
        (mockDb.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn<() => Promise<{ matchedUserId: number }[]>>().mockResolvedValue([]) }) });
        mockDb.query.users.findMany.mockResolvedValue([
            { id: 2, gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Match
            { id: 3, gender: 'female', birthday: new Date('1993-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Wrong gender
        ]);

        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(2); // Add non-null assertion
        expect((service as any).calculateCompatibility).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 2 }));
    });

    it('should filter candidates by age preference', async () => {
        mockDb.query.users.findFirst.mockResolvedValue({
            id: 1, gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 },
            datingPreferences: { userId: 1, genderPreference: 'male', minAge: 30, maxAge: 35, maxDistance: 50 }, // Age 30-35
        });
        (mockDb.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn<() => Promise<{ matchedUserId: number }[]>>().mockResolvedValue([]) }) });
        mockDb.query.users.findMany.mockResolvedValue([
            { id: 2, gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Too young (age 32 in 2024) - Assuming current year 2024 for test simplicity
            { id: 3, gender: 'male', birthday: new Date('1988-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Match (age 36) - Adjusting test logic, should be 30-35
            { id: 4, gender: 'male', birthday: new Date('1985-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Too old (age 39)
        ]);
         // Correcting the mock data based on preference 30-35
         mockDb.query.users.findMany.mockResolvedValue([
             { id: 2, gender: 'male', birthday: new Date('1994-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Too young (age 30) - Let's assume current date is mid-2024
             { id: 3, gender: 'male', birthday: new Date('1991-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Match (age 33)
             { id: 4, gender: 'male', birthday: new Date('1988-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Too old (age 36)
         ]);


        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(3); // Add non-null assertion
        expect((service as any).calculateCompatibility).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 3 }));
    });

     it('should filter candidates by distance', async () => {
        mockDb.query.users.findFirst.mockResolvedValue({
            id: 1, gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 40.7128, lon: -74.0060 }, // NYC
            datingPreferences: { userId: 1, genderPreference: 'male', minAge: 25, maxAge: 40, maxDistance: 50 }, // 50 km max distance
        });
        (mockDb.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn<() => Promise<{ matchedUserId: number }[]>>().mockResolvedValue([]) }) });
        mockDb.query.users.findMany.mockResolvedValue([
            { id: 2, gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 40.7580, lon: -73.9855 } }, // Near NYC (~5km) - Match
            { id: 3, gender: 'male', birthday: new Date('1993-01-01'), location: { lat: 34.0522, lon: -118.2437 } }, // Los Angeles - Too Far
            { id: 4, gender: 'male', birthday: new Date('1991-01-01'), location: null }, // No location - Skip
        ]);

        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(2); // Add non-null assertion
        expect((service as any).calculateCompatibility).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 2 }));
        expect((service as any).calculateCompatibility).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 4 }));
    });

     it('should exclude the user themselves from potential matches', async () => {
        mockDb.query.users.findFirst.mockResolvedValue({
            id: 1, gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 },
            datingPreferences: { userId: 1, genderPreference: 'male', minAge: 25, maxAge: 35, maxDistance: 50 },
        });
        (mockDb.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn<() => Promise<{ matchedUserId: number }[]>>().mockResolvedValue([]) }) });
        // findMany should ideally not return the user themselves based on the query, but we test the filter just in case
        mockDb.query.users.findMany.mockResolvedValue([
            { id: 1, gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Self
            { id: 2, gender: 'male', birthday: new Date('1993-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Match
        ]);

        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(2); // Add non-null assertion
    });

     it('should exclude users already matched or declined', async () => {
        mockDb.query.users.findFirst.mockResolvedValue({
            id: 1, gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 },
            datingPreferences: { userId: 1, genderPreference: 'male', minAge: 25, maxAge: 35, maxDistance: 50 },
        });
        // Mock existing matches fetch to return IDs 3 and 4
        (mockDb.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn<() => Promise<{ matchedUserId: number }[]>>().mockResolvedValue([{ matchedUserId: 3 }, { matchedUserId: 4 }]) }) });
        mockDb.query.users.findMany.mockResolvedValue([
            { id: 2, gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Potential Match
            { id: 3, gender: 'male', birthday: new Date('1993-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Already matched/declined
            { id: 4, gender: 'male', birthday: new Date('1991-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Already matched/declined
        ]);

        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe(2); // Add non-null assertion
        expect((service as any).calculateCompatibility).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 2 }));
        expect((service as any).calculateCompatibility).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 3 }));
        expect((service as any).calculateCompatibility).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: 4 }));
    });

    it('should sort results by compatibility score (descending)', async () => {
        mockDb.query.users.findFirst.mockResolvedValue({
            id: 1, gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 },
            datingPreferences: { userId: 1, genderPreference: 'male', minAge: 25, maxAge: 35, maxDistance: 50 },
        });
        (mockDb.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn<() => Promise<{ matchedUserId: number }[]>>().mockResolvedValue([]) }) });
        mockDb.query.users.findMany.mockResolvedValue([
            { id: 4, gender: 'male', birthday: new Date('1991-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Lower score
            { id: 2, gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Higher score
            { id: 3, gender: 'male', birthday: new Date('1993-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Medium score
        ]);
        // Mock calculateCompatibility returns score = 1 - (id / 100)
        // Expected order: ID 2 (score 0.98), ID 3 (score 0.97), ID 4 (score 0.96)

        const result = await service.findPotentialMatches(1);
        expect(result).toHaveLength(3);
        expect(result[0]!.id).toBe(2);
        expect(result[1]!.id).toBe(3);
        expect(result[2]!.id).toBe(4);
    });

     it('should apply the limit to the results', async () => {
        mockDb.query.users.findFirst.mockResolvedValue({
            id: 1, gender: 'female', birthday: new Date('1990-01-01'), location: { lat: 10, lon: 10 },
            datingPreferences: { userId: 1, genderPreference: 'male', minAge: 25, maxAge: 35, maxDistance: 50 },
        });
        (mockDb.select as jest.Mock).mockReturnValue({ from: jest.fn().mockReturnValue({ where: jest.fn<() => Promise<{ matchedUserId: number }[]>>().mockResolvedValue([]) }) });
        mockDb.query.users.findMany.mockResolvedValue([
            { id: 4, gender: 'male', birthday: new Date('1991-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Score 0.96
            { id: 2, gender: 'male', birthday: new Date('1992-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Score 0.98
            { id: 3, gender: 'male', birthday: new Date('1993-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Score 0.97
            { id: 5, gender: 'male', birthday: new Date('1990-01-01'), location: { lat: 10.1, lon: 10.1 } }, // Score 0.95
        ]);
        const limit = 2;
        // Expected result: ID 2, ID 3

        const result = await service.findPotentialMatches(1, limit);
        expect(result).toHaveLength(limit);
        expect(result[0]!.id).toBe(2);
        expect(result[1]!.id).toBe(3);
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

        const userA_NoValues = { ...mockUserA, values: { userId: 1, values: [] } };
        const userB_WithValues = { ...mockUserB_Compatible, values: { userId: 2, values: [{ name: 'A' }] } };
        const { breakdown: breakdown2 } = await (service as any).calculateCompatibility(userA_NoValues, userB_WithValues);
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
        const weights = (service as any).weights; // Access weights if possible, otherwise use defaults
        const expectedScore = (
            (1 * weights.dealbreakers) +
            (1 * weights.datingPreferences) +
            (1 * weights.values) +
            (1 * weights.interests) +
            (1 * weights.communication) + // Clamped
            (0 * weights.physical) // Clamped
        ) / (weights.dealbreakers + weights.datingPreferences + weights.values + weights.interests + weights.communication + weights.physical);
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

        // Mock user data for specific Jaccard scores
        const userA_Specific = {
            ...mockUserA,
            values: { userId: 1, values: [{ name: 'A' }, { name: 'B' }] }, // Jaccard = 0.5 vs B
            interests: { userId: 1, interests: [{ name: 'X' }] }, // Jaccard = 0 vs B
        };
        const userB_Specific = {
            ...mockUserB_Compatible,
            values: { userId: 2, values: [{ name: 'B' }, { name: 'C' }] },
            interests: { userId: 2, interests: [{ name: 'Y' }] },
        };

        const { score, breakdown } = await (service as any).calculateCompatibility(userA_Specific, userB_Specific);

        // Expected breakdown scores
        const expectedBreakdown = {
            dealbreakers: 1.0,
            datingPreferences: 1.0, // Assuming compatible
            values: 0.5, // Jaccard = 1 / (2+2-1) = 1/3 -> Let's adjust mock data for 0.5: A={A,B}, B={A,C} -> 1/(2+2-1)=1/3. Let's use A={A,B}, B={A,B,C,D} -> 2/(2+4-2)=2/4=0.5
            interests: 0.0, // Jaccard = 0 / (1+1-0) = 0
            communication: 0.8,
            physical: 0.6,
        };

         // Adjust mock data for expected 0.5 values score
         userA_Specific.values = { userId: 1, values: [{ name: 'A' }, { name: 'B' }] };
         userB_Specific.values = { userId: 2, values: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }] };
         expectedBreakdown.values = 0.5; // 2 / (2+4-2) = 0.5

        // Recalculate with adjusted data
        const { score: finalScore, breakdown: finalBreakdown } = await (service as any).calculateCompatibility(userA_Specific, userB_Specific);


        // Verify breakdown scores
        expect(finalBreakdown['dealbreakers']).toBe(expectedBreakdown.dealbreakers);
        expect(finalBreakdown['datingPreferences']).toBe(expectedBreakdown.datingPreferences);
        expect(finalBreakdown['values']).toBeCloseTo(expectedBreakdown.values);
        expect(finalBreakdown['interests']).toBeCloseTo(expectedBreakdown.interests);
        expect(finalBreakdown['communication']).toBeCloseTo(expectedBreakdown.communication);
        expect(finalBreakdown['physical']).toBeCloseTo(expectedBreakdown.physical);

        // Calculate expected weighted score
        const totalWeightedScore = (
            (expectedBreakdown.dealbreakers * weights.dealbreakers) +
            (expectedBreakdown.datingPreferences * weights.datingPreferences) +
            (expectedBreakdown.values * weights.values) +
            (expectedBreakdown.interests * weights.interests) +
            (expectedBreakdown.communication * weights.communication) +
            (expectedBreakdown.physical * weights.physical)
        );
        const totalWeight = weights.dealbreakers + weights.datingPreferences + weights.values + weights.interests + weights.communication + weights.physical;
        const expectedFinalScore = totalWeightedScore / totalWeight;

        expect(finalScore).toBeCloseTo(expectedFinalScore);
    });

    // TODO: Add more tests for calculateCompatibility:
    // [All items covered]
  });

});