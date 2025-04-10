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
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
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
  /** Unregisters a specific device token for the authenticated user. */
  unregisterDeviceToken?: Maybe<Scalars['Boolean']['output']>;
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


export type MutationUnregisterDeviceTokenArgs = {
  token: Scalars['String']['input'];
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

export type LoginMutationVariables = Exact<{
  input: LoginInput;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', accessToken: string, refreshToken?: string | null } };

export type RegisterMutationVariables = Exact<{
  input: RegisterInput;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'AuthPayload', accessToken: string, refreshToken?: string | null } };

export type UpdateAiFeatureConfigMutationVariables = Exact<{
  input: UpdateAiFeatureConfigInput;
}>;


export type UpdateAiFeatureConfigMutation = { __typename?: 'Mutation', updateAiFeatureConfig?: { __typename?: 'AiFeatureConfig', featureKey: string, providerName: string, modelName: string, updatedAt: any } | null };

export type GetAiFeatureConfigsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAiFeatureConfigsQuery = { __typename?: 'Query', getAiFeatureConfigs: Array<{ __typename?: 'AiFeatureConfig', featureKey: string, providerName: string, modelName: string, updatedAt: any }> };

export type GetAvailableAiProvidersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAvailableAiProvidersQuery = { __typename?: 'Query', getAvailableAiProviders: Array<{ __typename?: 'AvailableAiProvider', providerName: string, models: Array<string> }> };

export type RefreshTokenMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type RefreshTokenMutation = { __typename?: 'Mutation', refreshToken: { __typename?: 'AuthPayload', accessToken: string, refreshToken?: string | null } };

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


export type GetAdminUsersQuery = { __typename?: 'Query', getAdminUsers: { __typename?: 'AdminUserList', totalCount: number, users: Array<{ __typename?: 'AdminUser', id: string, firstName?: string | null, lastName?: string | null, role: UserRole, profileComplete: boolean, createdAt: any, updatedAt: any }> } };


export const LoginDocument = gql`
    mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    refreshToken
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
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
export const UpdateAiFeatureConfigDocument = gql`
    mutation UpdateAiFeatureConfig($input: UpdateAiFeatureConfigInput!) {
  updateAiFeatureConfig(input: $input) {
    featureKey
    providerName
    modelName
    updatedAt
  }
}
    `;
export type UpdateAiFeatureConfigMutationFn = Apollo.MutationFunction<UpdateAiFeatureConfigMutation, UpdateAiFeatureConfigMutationVariables>;

/**
 * __useUpdateAiFeatureConfigMutation__
 *
 * To run a mutation, you first call `useUpdateAiFeatureConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAiFeatureConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAiFeatureConfigMutation, { data, loading, error }] = useUpdateAiFeatureConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateAiFeatureConfigMutation(baseOptions?: Apollo.MutationHookOptions<UpdateAiFeatureConfigMutation, UpdateAiFeatureConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateAiFeatureConfigMutation, UpdateAiFeatureConfigMutationVariables>(UpdateAiFeatureConfigDocument, options);
      }
export type UpdateAiFeatureConfigMutationHookResult = ReturnType<typeof useUpdateAiFeatureConfigMutation>;
export type UpdateAiFeatureConfigMutationResult = Apollo.MutationResult<UpdateAiFeatureConfigMutation>;
export type UpdateAiFeatureConfigMutationOptions = Apollo.BaseMutationOptions<UpdateAiFeatureConfigMutation, UpdateAiFeatureConfigMutationVariables>;
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