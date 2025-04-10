import { gql } from '@apollo/client';

// Placeholder REFRESH_TOKEN_MUTATION - Adjust based on your API schema
export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($token: String!) { # Changed variable name
    refreshToken(token: $token) { # Changed argument name to match schema
      accessToken
      refreshToken # API might return a new refresh token too
    }
  }
`;

// Add other mutations as needed