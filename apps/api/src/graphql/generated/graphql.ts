import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { ApiContext } from './src/types/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
  Json: { input: { [key: string]: any }; output: { [key: string]: any }; }
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

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AdminUser: ResolverTypeWrapper<AdminUser>;
  AdminUserList: ResolverTypeWrapper<AdminUserList>;
  AiFeatureConfig: ResolverTypeWrapper<AiFeatureConfig>;
  AuthPayload: ResolverTypeWrapper<AuthPayload>;
  AvailableAiProvider: ResolverTypeWrapper<AvailableAiProvider>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ChatFeedback: ResolverTypeWrapper<ChatFeedback>;
  ChatFeedbackScope: ChatFeedbackScope;
  CoachConfig: ResolverTypeWrapper<CoachConfig>;
  CompatibilityScore: ResolverTypeWrapper<CompatibilityScore>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Json: ResolverTypeWrapper<Scalars['Json']['output']>;
  LoginInput: LoginInput;
  Message: ResolverTypeWrapper<Message>;
  Mutation: ResolverTypeWrapper<{}>;
  Platform: Platform;
  PotentialMatch: ResolverTypeWrapper<PotentialMatch>;
  Query: ResolverTypeWrapper<{}>;
  RegisterInput: RegisterInput;
  RegistrationCoachTurn: ResolverTypeWrapper<RegistrationCoachTurn>;
  RequestChatFeedbackInput: RequestChatFeedbackInput;
  SendRegistrationMessageInput: SendRegistrationMessageInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  UpdateAiFeatureConfigInput: UpdateAiFeatureConfigInput;
  User: ResolverTypeWrapper<User>;
  UserRole: UserRole;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AdminUser: AdminUser;
  AdminUserList: AdminUserList;
  AiFeatureConfig: AiFeatureConfig;
  AuthPayload: AuthPayload;
  AvailableAiProvider: AvailableAiProvider;
  Boolean: Scalars['Boolean']['output'];
  ChatFeedback: ChatFeedback;
  CoachConfig: CoachConfig;
  CompatibilityScore: CompatibilityScore;
  DateTime: Scalars['DateTime']['output'];
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  Json: Scalars['Json']['output'];
  LoginInput: LoginInput;
  Message: Message;
  Mutation: {};
  PotentialMatch: PotentialMatch;
  Query: {};
  RegisterInput: RegisterInput;
  RegistrationCoachTurn: RegistrationCoachTurn;
  RequestChatFeedbackInput: RequestChatFeedbackInput;
  SendRegistrationMessageInput: SendRegistrationMessageInput;
  String: Scalars['String']['output'];
  UpdateAiFeatureConfigInput: UpdateAiFeatureConfigInput;
  User: User;
}>;

export type AuthDirectiveArgs = {
  requires?: Maybe<UserRole>;
};

export type AuthDirectiveResolver<Result, Parent, ContextType = ApiContext, Args = AuthDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AdminUserResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['AdminUser'] = ResolversParentTypes['AdminUser']> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  profileComplete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['UserRole'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AdminUserListResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['AdminUserList'] = ResolversParentTypes['AdminUserList']> = ResolversObject<{
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  users?: Resolver<Array<ResolversTypes['AdminUser']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AiFeatureConfigResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['AiFeatureConfig'] = ResolversParentTypes['AiFeatureConfig']> = ResolversObject<{
  featureKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  modelName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  providerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AuthPayloadResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['AuthPayload'] = ResolversParentTypes['AuthPayload']> = ResolversObject<{
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  refreshToken?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AvailableAiProviderResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['AvailableAiProvider'] = ResolversParentTypes['AvailableAiProvider']> = ResolversObject<{
  models?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  providerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ChatFeedbackResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['ChatFeedback'] = ResolversParentTypes['ChatFeedback']> = ResolversObject<{
  suggestions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CoachConfigResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['CoachConfig'] = ResolversParentTypes['CoachConfig']> = ResolversObject<{
  registrationQuestions?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CompatibilityScoreResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['CompatibilityScore'] = ResolversParentTypes['CompatibilityScore']> = ResolversObject<{
  overall?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
  name: 'Json';
}

export type MessageResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['Message'] = ResolversParentTypes['Message']> = ResolversObject<{
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  matchId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  readAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>;
  senderId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  _empty?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  login?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'input'>>;
  refreshToken?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationRefreshTokenArgs, 'token'>>;
  register?: Resolver<ResolversTypes['AuthPayload'], ParentType, ContextType, RequireFields<MutationRegisterArgs, 'input'>>;
  registerDeviceToken?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRegisterDeviceTokenArgs, 'platform' | 'token'>>;
  requestChatFeedback?: Resolver<ResolversTypes['ChatFeedback'], ParentType, ContextType, RequireFields<MutationRequestChatFeedbackArgs, 'input'>>;
  sendRegistrationCoachMessage?: Resolver<ResolversTypes['RegistrationCoachTurn'], ParentType, ContextType, RequireFields<MutationSendRegistrationCoachMessageArgs, 'input'>>;
  unregisterDeviceToken?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationUnregisterDeviceTokenArgs, 'token'>>;
  updateAiFeatureConfig?: Resolver<Maybe<ResolversTypes['AiFeatureConfig']>, ParentType, ContextType, RequireFields<MutationUpdateAiFeatureConfigArgs, 'input'>>;
}>;

export type PotentialMatchResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['PotentialMatch'] = ResolversParentTypes['PotentialMatch']> = ResolversObject<{
  compatibility?: Resolver<ResolversTypes['CompatibilityScore'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  getAdminUser?: Resolver<Maybe<ResolversTypes['AdminUser']>, ParentType, ContextType, RequireFields<QueryGetAdminUserArgs, 'userId'>>;
  getAdminUsers?: Resolver<ResolversTypes['AdminUserList'], ParentType, ContextType, RequireFields<QueryGetAdminUsersArgs, 'limit' | 'offset'>>;
  getAiFeatureConfigs?: Resolver<Array<ResolversTypes['AiFeatureConfig']>, ParentType, ContextType>;
  getAvailableAiProviders?: Resolver<Array<ResolversTypes['AvailableAiProvider']>, ParentType, ContextType>;
  getCoachConfig?: Resolver<ResolversTypes['CoachConfig'], ParentType, ContextType>;
  getMessagesForMatch?: Resolver<Array<ResolversTypes['Message']>, ParentType, ContextType, RequireFields<QueryGetMessagesForMatchArgs, 'matchId'>>;
  getPotentialMatches?: Resolver<Array<ResolversTypes['PotentialMatch']>, ParentType, ContextType, RequireFields<QueryGetPotentialMatchesArgs, 'limit'>>;
  hello?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
}>;

export type RegistrationCoachTurnResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['RegistrationCoachTurn'] = ResolversParentTypes['RegistrationCoachTurn']> = ResolversObject<{
  newState?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  response?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<ContextType = ApiContext, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = ResolversObject<{
  bio?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  birthday?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  gender?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  profileComplete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  registrationStep?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['UserRole'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = ApiContext> = ResolversObject<{
  AdminUser?: AdminUserResolvers<ContextType>;
  AdminUserList?: AdminUserListResolvers<ContextType>;
  AiFeatureConfig?: AiFeatureConfigResolvers<ContextType>;
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  AvailableAiProvider?: AvailableAiProviderResolvers<ContextType>;
  ChatFeedback?: ChatFeedbackResolvers<ContextType>;
  CoachConfig?: CoachConfigResolvers<ContextType>;
  CompatibilityScore?: CompatibilityScoreResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  JSON?: GraphQLScalarType;
  Json?: GraphQLScalarType;
  Message?: MessageResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PotentialMatch?: PotentialMatchResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RegistrationCoachTurn?: RegistrationCoachTurnResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
}>;

export type DirectiveResolvers<ContextType = ApiContext> = ResolversObject<{
  auth?: AuthDirectiveResolver<any, any, ContextType>;
}>;
