import request from 'supertest';
import { Express } from 'express';
import { initializeApp } from '../../index'; // Changed

describe('Health Integration Tests (GraphQL)', () => {
  let app: Express; // Added

  beforeAll(async () => { // Added
    const initialized = await initializeApp();
    app = initialized.app;
  });

  // Optional: Add afterAll for potential cleanup if needed
  // afterAll(async () => {
  //   // Close server or other cleanup if necessary
  // });

  it('should return 200 OK for a basic GraphQL query', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({ query: 'query { __typename }' })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.data.__typename).toBe('Query'); // Basic check for GraphQL response structure
  });
});