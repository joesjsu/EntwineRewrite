import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation LoginUser($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user { # Request the user object
        id
        firstName
        lastName
        role
        profileComplete
        # Add other fields needed from the User type in AuthContext
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
    }
  }
`;