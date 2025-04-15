import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
  Json: { input: any; output: any; }
};

export type AdminUser = {
  __typename?: 'AdminUser';
  createdAt: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  profileComplete: Scalars['Boolean']['output'];
  role: UserRole;
  updatedAt: Scalars['DateTime']['output'];
};

export type AdminUserList = {
  __typename?: 'AdminUserList';
  totalCount: Scalars['Int']['output'];
  users: Array<AdminUser>;
};

export type AiFeatureConfig = {
  __typename?: 'AiFeatureConfig';
  featureKey: Scalars['String']['output'];
  modelName: Scalars['String']['output'];
  providerName: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  accessToken: Scalars['String']['output'];
  refreshToken?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
};

export type AvailableAiProvider = {
  __typename?: 'AvailableAiProvider';
  models: Array<Scalars['String']['output']>;
  providerName: Scalars['String']['output'];
};

export type ChatFeedback = {
  __typename?: 'ChatFeedback';
  suggestions: Array<Scalars['String']['output']>;
};

export type ChatFeedbackScope =
  | 'DRAFT'
  | 'FULL'
  | 'RECENT';

export type CoachConfig = {
  __typename?: 'CoachConfig';
  registrationQuestions: Array<Scalars['String']['output']>;
};

export type CompatibilityScore = {
  __typename?: 'CompatibilityScore';
  overall: Scalars['Float']['output'];
};

export type LoginInput = {
  password: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
};

export type Message = {
  __typename?: 'Message';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  matchId: Scalars['ID']['output'];
  readAt?: Maybe<Scalars['DateTime']['output']>;
  senderId: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['Boolean']['output']>;
  login: AuthPayload;
  refreshToken: AuthPayload;
  register: AuthPayload;
  /** Registers a device token for the authenticated user to receive push notifications. */
  registerDeviceToken?: Maybe<Scalars['Boolean']['output']>;
  /** Requests feedback or suggestions from the AI coach based on a chat context. */
  requestChatFeedback: ChatFeedback;
  /** Sends a user's message during the registration coaching process and gets the coach's reply. */
  sendRegistrationCoachMessage: RegistrationCoachTurn;
  setAdminUserStatus?: Maybe<AdminUser>;
  /** Unregisters a specific device token for the authenticated user. */
  unregisterDeviceToken?: Maybe<Scalars['Boolean']['output']>;
  updateAdminUser?: Maybe<AdminUser>;
  updateAiFeatureConfig?: Maybe<AiFeatureConfig>;
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationRefreshTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationRegisterArgs = {
  input: RegisterInput;
};


export type MutationRegisterDeviceTokenArgs = {
  platform: Platform;
  token: Scalars['String']['input'];
};


export type MutationRequestChatFeedbackArgs = {
  input: RequestChatFeedbackInput;
};


export type MutationSendRegistrationCoachMessageArgs = {
  input: SendRegistrationMessageInput;
};


export type MutationSetAdminUserStatusArgs = {
  input: SetAdminUserStatusInput;
};


export type MutationUnregisterDeviceTokenArgs = {
  token: Scalars['String']['input'];
};


export type MutationUpdateAdminUserArgs = {
  input: UpdateAdminUserInput;
};


export type MutationUpdateAiFeatureConfigArgs = {
  input: UpdateAiFeatureConfigInput;
};

export type Platform =
  | 'ANDROID'
  | 'IOS'
  | 'WEB';

export type PotentialMatch = {
  __typename?: 'PotentialMatch';
  compatibility: CompatibilityScore;
  user: User;
  userId: Scalars['ID']['output'];
};

export type Query = {
  __typename?: 'Query';
  getAdminUser?: Maybe<AdminUser>;
  getAdminUsers: AdminUserList;
  getAiFeatureConfigs: Array<AiFeatureConfig>;
  getAvailableAiProviders: Array<AvailableAiProvider>;
  /** Fetches the configuration for the AI Relationship Coach. */
  getCoachConfig: CoachConfig;
  /**
   * Fetches messages for a specific match, ordered by creation time.
   * Requires authentication.
   */
  getMessagesForMatch: Array<Message>;
  /** Fetches potential matches for the currently authenticated user. */
  getPotentialMatches: Array<PotentialMatch>;
  hello?: Maybe<Scalars['String']['output']>;
  me?: Maybe<User>;
};


export type QueryGetAdminUserArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryGetAdminUsersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetMessagesForMatchArgs = {
  matchId: Scalars['ID']['input'];
};


export type QueryGetPotentialMatchesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};

export type RegisterInput = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
};

export type RegistrationCoachTurn = {
  __typename?: 'RegistrationCoachTurn';
  newState: Scalars['JSON']['output'];
  response: Scalars['String']['output'];
};

export type RequestChatFeedbackInput = {
  chatId: Scalars['ID']['input'];
  draftContent?: InputMaybe<Scalars['String']['input']>;
  recentMessageCount?: InputMaybe<Scalars['Int']['input']>;
  scope: ChatFeedbackScope;
};

export type SendRegistrationMessageInput = {
  currentState: Scalars['JSON']['input'];
  message: Scalars['String']['input'];
};

export type SetAdminUserStatusInput = {
  isActive: Scalars['Boolean']['input'];
  userId: Scalars['ID']['input'];
};

export type UpdateAdminUserInput = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  profileComplete?: InputMaybe<Scalars['Boolean']['input']>;
  role?: InputMaybe<UserRole>;
  userId: Scalars['ID']['input'];
};

export type UpdateAiFeatureConfigInput = {
  featureKey: Scalars['String']['input'];
  modelName: Scalars['String']['input'];
  providerName: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  bio?: Maybe<Scalars['String']['output']>;
  birthday?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  profileComplete: Scalars['Boolean']['output'];
  registrationStep: Scalars['Int']['output'];
  role: UserRole;
  updatedAt: Scalars['String']['output'];
};

export type UserRole =
  | 'ADMIN'
  | 'USER';

export type LoginUserMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginUserMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', accessToken: string, refreshToken?: string | null, user?: { __typename?: 'User', id: string, firstName?: string | null, lastName?: string | null, role: UserRole, profileComplete: boolean } | null } };

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'AuthPayload', accessToken: string, refreshToken?: string | null } };

export type RefreshTokenMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type RefreshTokenMutation = { __typename?: 'Mutation', refreshToken: { __typename?: 'AuthPayload', accessToken: string, refreshToken?: string | null } };

export type SetAdminUserStatusMutationVariables = Exact<{
  input: SetAdminUserStatusInput;
}>;


export type SetAdminUserStatusMutation = { __typename?: 'Mutation', setAdminUserStatus?: { __typename?: 'AdminUser', id: string, isActive: boolean } | null };

export type UpdateAdminUserMutationVariables = Exact<{
  input: UpdateAdminUserInput;
}>;


export type UpdateAdminUserMutation = { __typename?: 'Mutation', updateAdminUser?: { __typename?: 'AdminUser', id: string, firstName?: string | null, lastName?: string | null, email?: string | null, role: UserRole, profileComplete: boolean, updatedAt: any } | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, email?: string | null, firstName?: string | null, lastName?: string | null, profileComplete: boolean, registrationStep: number, role: UserRole } | null };

export type GetMessagesQueryVariables = Exact<{
  matchId: Scalars['ID']['input'];
}>;


export type GetMessagesQuery = { __typename?: 'Query', getMessagesForMatch: Array<{ __typename?: 'Message', id: string, content: string, senderId: string, matchId: string, createdAt: any, readAt?: any | null }> };

export type GetAdminUsersQueryVariables = Exact<{
  offset?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetAdminUsersQuery = { __typename?: 'Query', getAdminUsers: { __typename?: 'AdminUserList', totalCount: number, users: Array<{ __typename?: 'AdminUser', id: string, firstName?: string | null, lastName?: string | null, role: UserRole, profileComplete: boolean, createdAt: any, updatedAt: any, email?: string | null, isActive: boolean }> } };

export type GetAdminUserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetAdminUserQuery = { __typename?: 'Query', getAdminUser?: { __typename?: 'AdminUser', id: string, firstName?: string | null, lastName?: string | null, role: UserRole, profileComplete: boolean, createdAt: any, updatedAt: any } | null };

export type GetAiFeatureConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAiFeatureConfigsQuery = { __typename?: 'Query', getAiFeatureConfigs: Array<{ __typename?: 'AiFeatureConfig', featureKey: string, providerName: string, modelName: string, updatedAt: any }> };

export type GetAvailableAiProvidersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableAiProvidersQuery = { __typename?: 'Query', getAvailableAiProviders: Array<{ __typename?: 'AvailableAiProvider', providerName: string, models: Array<string> }> };


export const LoginUserDocument = gql`
    mutation LoginUser($input: LoginInput!) {
  login(input: $input) {
    accessToken
    refreshToken
    user {
      id
      firstName
      lastName
      role
      profileComplete
    }
  }
}
    `;
export type LoginUserMutationFn = Apollo.MutationFunction<LoginUserMutation, LoginUserMutationVariables>;

/**
 * __useLoginUserMutation__
 *
 * To run a mutation, you first call `useLoginUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginUserMutation, { data, loading, error }] = useLoginUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginUserMutation(baseOptions?: Apollo.MutationHookOptions<LoginUserMutation, LoginUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginUserMutation, LoginUserMutationVariables>(LoginUserDocument, options);
      }
export type LoginUserMutationHookResult = ReturnType<typeof useLoginUserMutation>;
export type LoginUserMutationResult = Apollo.MutationResult<LoginUserMutation>;
export type LoginUserMutationOptions = Apollo.BaseMutationOptions<LoginUserMutation, LoginUserMutationVariables>;
export const RegisterDocument = gql`
    mutation Register($input: RegisterInput!) {
  register(input: $input) {
    accessToken
    refreshToken
  }
}
    `;
export type RegisterMutationFn = Apollo.MutationFunction<RegisterMutation, RegisterMutationVariables>;

/**
 * __useRegisterMutation__
 *
 * To run a mutation, you first call `useRegisterMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRegisterMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [registerMutation, { data, loading, error }] = useRegisterMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRegisterMutation(baseOptions?: Apollo.MutationHookOptions<RegisterMutation, RegisterMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument, options);
      }
export type RegisterMutationHookResult = ReturnType<typeof useRegisterMutation>;
export type RegisterMutationResult = Apollo.MutationResult<RegisterMutation>;
export type RegisterMutationOptions = Apollo.BaseMutationOptions<RegisterMutation, RegisterMutationVariables>;
export const RefreshTokenDocument = gql`
    mutation RefreshToken($token: String!) {
  refreshToken(token: $token) {
    accessToken
    refreshToken
  }
}
    `;
export type RefreshTokenMutationFn = Apollo.MutationFunction<RefreshTokenMutation, RefreshTokenMutationVariables>;

/**
 * __useRefreshTokenMutation__
 *
 * To run a mutation, you first call `useRefreshTokenMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefreshTokenMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refreshTokenMutation, { data, loading, error }] = useRefreshTokenMutation({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useRefreshTokenMutation(baseOptions?: Apollo.MutationHookOptions<RefreshTokenMutation, RefreshTokenMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RefreshTokenMutation, RefreshTokenMutationVariables>(RefreshTokenDocument, options);
      }
export type RefreshTokenMutationHookResult = ReturnType<typeof useRefreshTokenMutation>;
export type RefreshTokenMutationResult = Apollo.MutationResult<RefreshTokenMutation>;
export type RefreshTokenMutationOptions = Apollo.BaseMutationOptions<RefreshTokenMutation, RefreshTokenMutationVariables>;
export const SetAdminUserStatusDocument = gql`
    mutation SetAdminUserStatus($input: SetAdminUserStatusInput!) {
  setAdminUserStatus(input: $input) {
    id
    isActive
  }
}
    `;
export type SetAdminUserStatusMutationFn = Apollo.MutationFunction<SetAdminUserStatusMutation, SetAdminUserStatusMutationVariables>;

/**
 * __useSetAdminUserStatusMutation__
 *
 * To run a mutation, you first call `useSetAdminUserStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetAdminUserStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setAdminUserStatusMutation, { data, loading, error }] = useSetAdminUserStatusMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSetAdminUserStatusMutation(baseOptions?: Apollo.MutationHookOptions<SetAdminUserStatusMutation, SetAdminUserStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetAdminUserStatusMutation, SetAdminUserStatusMutationVariables>(SetAdminUserStatusDocument, options);
      }
export type SetAdminUserStatusMutationHookResult = ReturnType<typeof useSetAdminUserStatusMutation>;
export type SetAdminUserStatusMutationResult = Apollo.MutationResult<SetAdminUserStatusMutation>;
export type SetAdminUserStatusMutationOptions = Apollo.BaseMutationOptions<SetAdminUserStatusMutation, SetAdminUserStatusMutationVariables>;
export const UpdateAdminUserDocument = gql`
    mutation UpdateAdminUser($input: UpdateAdminUserInput!) {
  updateAdminUser(input: $input) {
    id
    firstName
    lastName
    email
    role
    profileComplete
    updatedAt
  }
}
    `;
export type UpdateAdminUserMutationFn = Apollo.MutationFunction<UpdateAdminUserMutation, UpdateAdminUserMutationVariables>;

/**
 * __useUpdateAdminUserMutation__
 *
 * To run a mutation, you first call `useUpdateAdminUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAdminUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAdminUserMutation, { data, loading, error }] = useUpdateAdminUserMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAdminUserMutation(baseOptions?: Apollo.MutationHookOptions<UpdateAdminUserMutation, UpdateAdminUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateAdminUserMutation, UpdateAdminUserMutationVariables>(UpdateAdminUserDocument, options);
      }
export type UpdateAdminUserMutationHookResult = ReturnType<typeof useUpdateAdminUserMutation>;
export type UpdateAdminUserMutationResult = Apollo.MutationResult<UpdateAdminUserMutation>;
export type UpdateAdminUserMutationOptions = Apollo.BaseMutationOptions<UpdateAdminUserMutation, UpdateAdminUserMutationVariables>;
export const MeDocument = gql`
    query Me {
  me {
    id
    email
    firstName
    lastName
    profileComplete
    registrationStep
    role
  }
}
    `;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const GetMessagesDocument = gql`
    query GetMessages($matchId: ID!) {
  getMessagesForMatch(matchId: $matchId) {
    id
    content
    senderId
    matchId
    createdAt
    readAt
  }
}
    `;

/**
 * __useGetMessagesQuery__
 *
 * To run a query within a React component, call `useGetMessagesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMessagesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMessagesQuery({
 *   variables: {
 *      matchId: // value for 'matchId'
 *   },
 * });
 */
export function useGetMessagesQuery(baseOptions: Apollo.QueryHookOptions<GetMessagesQuery, GetMessagesQueryVariables> & ({ variables: GetMessagesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMessagesQuery, GetMessagesQueryVariables>(GetMessagesDocument, options);
      }
export function useGetMessagesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMessagesQuery, GetMessagesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMessagesQuery, GetMessagesQueryVariables>(GetMessagesDocument, options);
        }
export function useGetMessagesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMessagesQuery, GetMessagesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetMessagesQuery, GetMessagesQueryVariables>(GetMessagesDocument, options);
        }
export type GetMessagesQueryHookResult = ReturnType<typeof useGetMessagesQuery>;
export type GetMessagesLazyQueryHookResult = ReturnType<typeof useGetMessagesLazyQuery>;
export type GetMessagesSuspenseQueryHookResult = ReturnType<typeof useGetMessagesSuspenseQuery>;
export type GetMessagesQueryResult = Apollo.QueryResult<GetMessagesQuery, GetMessagesQueryVariables>;
export const GetAdminUsersDocument = gql`
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
      email
      isActive
    }
  }
}
    `;

/**
 * __useGetAdminUsersQuery__
 *
 * To run a query within a React component, call `useGetAdminUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAdminUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAdminUsersQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetAdminUsersQuery(baseOptions?: Apollo.QueryHookOptions<GetAdminUsersQuery, GetAdminUsersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAdminUsersQuery, GetAdminUsersQueryVariables>(GetAdminUsersDocument, options);
      }
export function useGetAdminUsersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAdminUsersQuery, GetAdminUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAdminUsersQuery, GetAdminUsersQueryVariables>(GetAdminUsersDocument, options);
        }
export function useGetAdminUsersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAdminUsersQuery, GetAdminUsersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAdminUsersQuery, GetAdminUsersQueryVariables>(GetAdminUsersDocument, options);
        }
export type GetAdminUsersQueryHookResult = ReturnType<typeof useGetAdminUsersQuery>;
export type GetAdminUsersLazyQueryHookResult = ReturnType<typeof useGetAdminUsersLazyQuery>;
export type GetAdminUsersSuspenseQueryHookResult = ReturnType<typeof useGetAdminUsersSuspenseQuery>;
export type GetAdminUsersQueryResult = Apollo.QueryResult<GetAdminUsersQuery, GetAdminUsersQueryVariables>;
export const GetAdminUserDocument = gql`
    query GetAdminUser($userId: ID!) {
  getAdminUser(userId: $userId) {
    id
    firstName
    lastName
    role
    profileComplete
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useGetAdminUserQuery__
 *
 * To run a query within a React component, call `useGetAdminUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAdminUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAdminUserQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetAdminUserQuery(baseOptions: Apollo.QueryHookOptions<GetAdminUserQuery, GetAdminUserQueryVariables> & ({ variables: GetAdminUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAdminUserQuery, GetAdminUserQueryVariables>(GetAdminUserDocument, options);
      }
export function useGetAdminUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAdminUserQuery, GetAdminUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAdminUserQuery, GetAdminUserQueryVariables>(GetAdminUserDocument, options);
        }
export function useGetAdminUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAdminUserQuery, GetAdminUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAdminUserQuery, GetAdminUserQueryVariables>(GetAdminUserDocument, options);
        }
export type GetAdminUserQueryHookResult = ReturnType<typeof useGetAdminUserQuery>;
export type GetAdminUserLazyQueryHookResult = ReturnType<typeof useGetAdminUserLazyQuery>;
export type GetAdminUserSuspenseQueryHookResult = ReturnType<typeof useGetAdminUserSuspenseQuery>;
export type GetAdminUserQueryResult = Apollo.QueryResult<GetAdminUserQuery, GetAdminUserQueryVariables>;
export const GetAiFeatureConfigsDocument = gql`
    query GetAiFeatureConfigs {
  getAiFeatureConfigs {
    featureKey
    providerName
    modelName
    updatedAt
  }
}
    `;

/**
 * __useGetAiFeatureConfigsQuery__
 *
 * To run a query within a React component, call `useGetAiFeatureConfigsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAiFeatureConfigsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAiFeatureConfigsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAiFeatureConfigsQuery(baseOptions?: Apollo.QueryHookOptions<GetAiFeatureConfigsQuery, GetAiFeatureConfigsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAiFeatureConfigsQuery, GetAiFeatureConfigsQueryVariables>(GetAiFeatureConfigsDocument, options);
      }
export function useGetAiFeatureConfigsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAiFeatureConfigsQuery, GetAiFeatureConfigsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAiFeatureConfigsQuery, GetAiFeatureConfigsQueryVariables>(GetAiFeatureConfigsDocument, options);
        }
export function useGetAiFeatureConfigsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAiFeatureConfigsQuery, GetAiFeatureConfigsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAiFeatureConfigsQuery, GetAiFeatureConfigsQueryVariables>(GetAiFeatureConfigsDocument, options);
        }
export type GetAiFeatureConfigsQueryHookResult = ReturnType<typeof useGetAiFeatureConfigsQuery>;
export type GetAiFeatureConfigsLazyQueryHookResult = ReturnType<typeof useGetAiFeatureConfigsLazyQuery>;
export type GetAiFeatureConfigsSuspenseQueryHookResult = ReturnType<typeof useGetAiFeatureConfigsSuspenseQuery>;
export type GetAiFeatureConfigsQueryResult = Apollo.QueryResult<GetAiFeatureConfigsQuery, GetAiFeatureConfigsQueryVariables>;
export const GetAvailableAiProvidersDocument = gql`
    query GetAvailableAiProviders {
  getAvailableAiProviders {
    providerName
    models
  }
}
    `;

/**
 * __useGetAvailableAiProvidersQuery__
 *
 * To run a query within a React component, call `useGetAvailableAiProvidersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAvailableAiProvidersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAvailableAiProvidersQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAvailableAiProvidersQuery(baseOptions?: Apollo.QueryHookOptions<GetAvailableAiProvidersQuery, GetAvailableAiProvidersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAvailableAiProvidersQuery, GetAvailableAiProvidersQueryVariables>(GetAvailableAiProvidersDocument, options);
      }
export function useGetAvailableAiProvidersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAvailableAiProvidersQuery, GetAvailableAiProvidersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAvailableAiProvidersQuery, GetAvailableAiProvidersQueryVariables>(GetAvailableAiProvidersDocument, options);
        }
export function useGetAvailableAiProvidersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAvailableAiProvidersQuery, GetAvailableAiProvidersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAvailableAiProvidersQuery, GetAvailableAiProvidersQueryVariables>(GetAvailableAiProvidersDocument, options);
        }
export type GetAvailableAiProvidersQueryHookResult = ReturnType<typeof useGetAvailableAiProvidersQuery>;
export type GetAvailableAiProvidersLazyQueryHookResult = ReturnType<typeof useGetAvailableAiProvidersLazyQuery>;
export type GetAvailableAiProvidersSuspenseQueryHookResult = ReturnType<typeof useGetAvailableAiProvidersSuspenseQuery>;
export type GetAvailableAiProvidersQueryResult = Apollo.QueryResult<GetAvailableAiProvidersQuery, GetAvailableAiProvidersQueryVariables>;