import { gql } from '@apollo/client';

// Query to fetch user's own data (already used in AuthContext)
export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      firstName # Changed from name
      lastName  # Added lastName
      profileComplete
      registrationStep
      role # Add the role field
      # Add other fields as needed by the frontend
    }
  }
`;

// Query to fetch messages for a specific match
export const GET_MESSAGES_QUERY = gql`
  query GetMessages($matchId: ID!) {
    getMessagesForMatch(matchId: $matchId) { # Use the correct query name
      id
      content # Changed from 'text' to match schema
      senderId
      matchId # recipientId is not in the Message type
      createdAt
      readAt
      # Include sender details if needed/available via relation
      # sender {
      #   id
      #   firstName
      #   lastName
      # }
    }
  }
`;


// Query for admins to fetch a list of users
export const GET_ADMIN_USERS = gql`
  query GetAdminUsers($offset: Int, $limit: Int) {
    getAdminUsers(offset: $offset, limit: $limit) {
      totalCount
      users {
        id
        firstName
        lastName
        role
        profileComplete
        createdAt
        updatedAt
        # Add email/phone if needed and available in AdminUser type
      }
    }
  }
`;

// Add other queries needed by the web app here...