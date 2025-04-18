# Entwine App Rewrite: Architectural Plan (v6 - Final)

## 1. Introduction & Goals

*   **Objective:** Rewrite the Entwine application in a new repository to achieve cleaner code, improved scalability (target ~3000 concurrent users), enhanced security, and native support for future iOS/Android mobile clients via React Native.

**IMPORTANT NOTE:** This document pertains to the **EntwineRewrite** project located at `C:\Users\matti\Desktop\EntwineRewrite`. This is a separate codebase from the original application (`SoulConnectionPlatform`). All development, commands, and file paths referenced herein should be relative to the `EntwineRewrite` directory unless explicitly stated otherwise.

*   **Core Concepts:** Retain the fundamental features and concepts of the original application (AI matching, communication analysis, coaching, admin console), including multi-dimensional ranking and contextual AI coaching.
*   **Asset Reuse:** Utilize existing logos, branding, and other relevant static assets from the current application.

## 2. Guiding Principles

*   **API-First:** Design the backend as a standalone API consumed by multiple clients (web, mobile).
*   **Statelessness:** Backend services will be stateless to facilitate scaling and simplify client interactions.
*   **Security by Design:** Integrate security considerations from the outset.
*   **Scalability:** Architect components (API, database, real-time, caching) with the target user load in mind.
*   **Testability:** Structure code for effective unit, integration, and end-to-end testing.
*   **Shared Code:** Maximize code sharing (types, validation, core logic) between backend and clients.
*   **Environment Parity & Isolation:** Maintain distinct environments (Dev, Staging, Prod) with isolated data stores.
*   **Contextual AI Assistance:** Leverage AI for matching and real-time guidance during user interactions.
*   **Data-Driven Insights:** Provide users with clear, multi-faceted insights into compatibility.
*   **AI Model Flexibility:** Allow administrators to configure and select specific AI models from various providers per feature.

## 3. Proposed High-Level Architecture

```mermaid
graph TD
    subgraph "Monorepo (Turborepo/Nx)"
        P_SHARED[packages/shared (Types, Validation, Constants)];
        APP_API[apps/api (Backend)];
        APP_WEB[apps/web (React Client)];
        APP_MOBILE[apps/mobile (React Native - Future)];
    end

    subgraph "Clients"
        C_WEB[Web Browser];
        C_MOBILE[Mobile Device (iOS/Android)];
    end

    subgraph "Backend Infrastructure (apps/api)"
        API_GW[GraphQL API (Apollo Server)];
        AUTH_SVC[Auth Service (JWT)];
        MATCH_RANK_SVC[Matching & Ranking Service];
        COACH_SVC[AI Coaching Service];
        AI_ABS_LAYER{AI Abstraction Layer}; # <-- Includes Simplified Interface
        WS_SVC[WebSocket Service (Socket.IO)];
        PUSH_SVC[Push Notification Service (FCM/APNS)];
        CACHE_SVC[Caching Service (Redis)];
        BIZ_LOGIC[Core Business Logic Services];
        DB_LAYER[Database Layer (Drizzle)];
    end

    subgraph "External Services"
        DB[PostgreSQL (Neon)];
        REDIS[Redis Instance];
        AI_GOOGLE[Google AI API (Gemini)];
        AI_OPENAI[OpenAI API];
        AI_XAI[xAI API (Grok)];
        AI_ANTHROPIC[Anthropic API];
        AI_DEEPSEEK[DeepSeek API];
        MAPS_API[Google Maps API];
        FCM[Firebase Cloud Messaging];
        APNS[Apple Push Notification Service];
    end

    # Client Connections
    C_WEB --> APP_WEB;
    C_MOBILE --> APP_MOBILE;
    APP_WEB --> API_GW;
    APP_MOBILE --> API_GW;

    # Monorepo Dependencies
    APP_API --- P_SHARED;
    APP_WEB --- P_SHARED;
    APP_MOBILE --- P_SHARED;

    # API Gateway Connections
    API_GW --> AUTH_SVC;
    API_GW --> BIZ_LOGIC;
    API_GW --> MATCH_RANK_SVC;
    API_GW --> COACH_SVC;
    API_GW --> WS_SVC;

    # Service Connections
    BIZ_LOGIC --> DB_LAYER;
    BIZ_LOGIC --> CACHE_SVC;
    BIZ_LOGIC --> AUTH_SVC;

    MATCH_RANK_SVC --> DB_LAYER;
    MATCH_RANK_SVC --> CACHE_SVC;
    MATCH_RANK_SVC --> BIZ_LOGIC;
    MATCH_RANK_SVC --> AI_ABS_LAYER;

    COACH_SVC --> AI_ABS_LAYER;
    COACH_SVC --> DB_LAYER;
    COACH_SVC --> CACHE_SVC;
    COACH_SVC --> BIZ_LOGIC;

    AUTH_SVC --> DB_LAYER;
    AUTH_SVC --> CACHE_SVC;

    DB_LAYER --> DB;
    CACHE_SVC --> REDIS;

    # AI Abstraction Layer Connections
    AI_ABS_LAYER --> AI_GOOGLE;
    AI_ABS_LAYER --> AI_OPENAI;
    AI_ABS_LAYER --> AI_XAI;
    AI_ABS_LAYER --> AI_ANTHROPIC;
    AI_ABS_LAYER --> AI_DEEPSEEK;

    # Real-time & Push Connections
    WS_SVC <--> C_WEB;
    WS_SVC <--> C_MOBILE;
    WS_SVC --> BIZ_LOGIC;
    WS_SVC --> COACH_SVC;

    PUSH_SVC --> FCM;
    PUSH_SVC --> APNS;
    FCM --> C_MOBILE;
    APNS --> C_MOBILE;
```

## 4. Technology Stack

*   **Monorepo:** Turborepo (or Nx) with pnpm
*   **Backend (`apps/api`):**
    *   Runtime: Node.js (LTS version)
    *   Language: TypeScript
    *   Framework: Express.js (or consider NestJS)
    *   API Layer: Apollo Server (GraphQL)
    *   Authentication: `jsonwebtoken` (JWT), Passport.js JWT strategy
    *   Real-time: Socket.IO
    *   Push Notifications: `node-pushnotifications` or platform SDKs
    *   Database ORM: Drizzle ORM
    *   Caching: Redis client library (e.g., `ioredis`)
    *   AI Integration: SDKs/Clients for chosen providers (`@google/generative-ai`, `openai`, `anthropic`, etc.)
*   **Database:** PostgreSQL (via Neon)
*   **Cache:** Redis
*   **Web Client (`apps/web`):**
    *   Framework: React
    *   Language: TypeScript
    *   Build Tool: Next.js (Note: Plan previously mentioned Vite, but project uses Next.js)
    *   Styling: Tailwind CSS, Shadcn UI with purple as the base color ✅ DONE
    *   GraphQL Client: Apollo Client
    *   Routing: Wouter (or React Router)
    *   UI Implementation: Consistent purple theme matching design screenshots ✅ DONE
*   **Mobile Client (`apps/mobile` - Future):**
    *   Framework: React Native
    *   Language: TypeScript
    *   UI Components: React Native Paper
    *   GraphQL Client: Apollo Client
    *   Navigation: React Navigation
    *   Foundation: Basic project structure and shared code strategy established ✅ DONE
    *   For detailed implementation plan, see [Mobile App Interface Plan](./entwine_mobile_app_interface_plan.md)
*   **Shared Package (`packages/shared`):**
    *   Language: TypeScript
    *   Validation: Zod
*   **Testing:** Jest (Unit/Integration), Playwright or Cypress (E2E)

## 5. Core Functional Areas Supported

This architecture is designed to support the implementation of the following key functional areas:
*   User Registration & Authentication
*   Detailed User Profiling (Photos, Bio, Preferences, Values, Interests, Dealbreakers, Improvement Areas)
*   Multi-Dimensional Profile Matching & Ranking
*   AI Persona Interaction System
*   Real-time Chat (User-to-User)
*   Enhanced AI Relationship Coaching (Registration & In-Chat)
*   AI-driven Analysis (Photo attributes/age, Communication style/patterns, Interest extraction)
*   Admin Console (User Management, System/AI Config including AI Model Selection per Feature, Content Moderation, Analytics Views, Batch Operations, Impersonation)
*   Safety Features (Blocking, Reporting)
*   Push Notifications

## 6. Key Workflows & Implementation Details
### 6.1 Registration Flow Sequence ✅ DONE (Implementation Complete with Intra-Step Saving)


The application will guide new users through a multi-step registration process designed to gather comprehensive profile information for effective matching and coaching. The planned sequence is as follows:

1.  **Initial Signup:** User provides basic credentials (e.g., phone number, password) and potentially name/gender. An initial user record is created (`registrationStep: 0`).
2.  **Basic Profile:** User provides core profile details (e.g., birthday, location, bio, initial profile photo upload). (`registrationStep: 1`). The uploaded photo triggers AI analysis for physical attributes.
3.  **Dating Preferences:** User specifies preferences for potential matches (e.g., gender, age range, distance). (`registrationStep: 2`).
4.  **Photo Rating (Physical Preference Elicitation):** User rates a series of photos to help the AI understand their physical preferences more deeply. The number of photos shown may vary based on user settings. (`registrationStep: 3`). Results update the `physicalPreferences` data.
5.  **AI Relationship Coach Interaction:** User engages in a structured conversation with the AI coach (potentially using pre-defined questions from `coachConfig`) to elicit core values, relationship goals, and other key compatibility factors. (`registrationStep: 4`). Results populate `userValues` and potentially other profile sections. Requires `introScreens` of type `relationship_coach`.
6.  **AI Persona Chats (Communication Style & Interest Elicitation):** User chats sequentially with **exactly 6 different** AI personas matching their preferences. A minimum number of interactions (e.g., **6 messages** from the user) per persona is required to proceed. (`registrationStep: 5`).
    *   **Data Derivation:** Chat data (user messages) is sent to backend services which utilize the configured AI model (via the AI Abstraction Layer) to analyze linguistic patterns (inferring communication style metrics like directness, expressiveness) and extract keywords/topics (identifying potential user interests). These results populate the `communicationStyles` and `userInterests` data.
    *   **UI/UX:** The user interacts via a chat interface. Clear indicators will show which persona is active (e.g., "Chatting with Persona 3 of 6") and track interaction progress (e.g., "Messages sent: 4/6"). Navigation controls (e.g., "Next Persona") will be enabled only after the minimum interaction count for the current persona is met.
    *   Requires `introScreens` of type `ai_chat` to be displayed before this step begins.
7.  **Registration Complete:** Upon successful completion of all steps, the `registrationStep` is updated, and the `profileComplete` flag is set to `true`, granting access to the main application features.

*Note: The `registrationStep` field in the `users` table tracks the user's progress through this flow, allowing them to resume if they leave and come back.*


*Note: For a detailed frontend implementation plan including component structure, state management, API integration, and UI/UX considerations with intra-step saving, see [Registration Flow Frontend Plan](./docs/registration_flow_frontend_plan.md). This plan has been fully implemented with all registration steps and intra-step saving functionality.*
### 6.2 Key Architectural Changes & Implementation Details (Previously Section 6)

*   **Monorepo Setup:** ✅ DONE - Structure using `apps/` and `packages/`. Configured Turborepo/pnpm. Initial packages (`api`, `web`, `mobile`, `shared`, configs) created. Dependencies installed and linked. Updated `turbo.json` build task outputs to include `dist/**` for better caching.
*   **GraphQL API:** ✅ DONE (Basic Setup) - Schema-first design using Apollo Server. Basic schema files loaded. Placeholder resolvers implemented. Basic server running.
*   **Authentication (JWT):** ✅ DONE (Backend Complete), ✅ DONE (Client-Side Integration), ✅ DONE (Login/Signup UI), ✅ DONE (Protected Routes) - Backend: Implemented access token strategy (Passport JWT), registration/login logic (`AuthService` with bcrypt/JWT), context integration, placeholder secrets, and refresh token storage/validation using Redis (`AuthService`). Completed GraphQL integration (`refreshToken` mutation/resolver). **Client-Side (`apps/web`):** Implemented `AuthContext` using React Context and Apollo Client hooks (handles token storage, login/logout, token attachment, refresh). Integrated `ApolloProvider` and `AuthProvider` into `layout.tsx`. Created `ProtectedRoute` component (`apps/web/components/auth/ProtectedRoute.tsx`) using `useAuth` hook to handle redirection based on auth state. Applied `ProtectedRoute` to main page (`apps/web/app/page.tsx`). **UI:** Set up Tailwind CSS (`tailwind.config.ts`, `postcss.config.mjs`, `globals.css`). Installed `lucide-react`. Added Shadcn UI (`components.json`, base color: Zinc) and necessary components (`button`, `input`, `label`, `card`, `alert`). Created `LoginForm` and `SignupForm` components (`apps/web/app/auth/components/`) using Shadcn UI, context, and GraphQL mutations. Created corresponding pages (`/login`, `/signup`). Added navigation links between forms.
*   **Database & Indexing:** ✅ DONE (Schema & Initial Migrations) - Refined Drizzle schema defined in `packages/shared`. Drizzle Kit configured. Initial migration generated and applied. DB client setup in `apps/api`. Manual migrations applied up to `0006` (interest flags). (Further indexing TBD).
*   **Real-time (Hybrid):** ✅ DONE (Backend Complete), ✅ DONE (Client-Side UI Refinements) - Backend: Integrated `socket.io` with HTTP server (`apps/api/src/index.ts`), including JWT auth, basic chat persistence, push notifications via `PushService`, and event handlers for typing indicators/read receipts (with DB updates). **Client-Side Setup:** Installed `socket.io-client`, created `SocketContext` (`apps/web/context/SocketContext.tsx`), integrated `SocketProvider` (`apps/web/app/layout.tsx`). **Created basic chat UI components:** `ChatWindow.tsx`, `MessageList.tsx`, `MessageInput.tsx`, `TypingIndicator.tsx` in `apps/web/app/components/`. Integrated `ChatWindow` into `apps/web/app/page.tsx`. **Enhancements:** Replaced placeholder user ID in `page.tsx` with actual ID from `AuthContext`. Implemented fetching initial chat messages in `ChatWindow.tsx` using Apollo `useQuery` and `GET_MESSAGES_QUERY` (defined in `apps/web/graphql/queries.ts`). Updated `MessageList.tsx` to use `createdAt` field. Added basic loading/error states for message fetching. **UI Refinements:** Implemented scroll-to-bottom in `MessageList.tsx`. Added improved error handling (connection status, message send failures) in `ChatWindow.tsx`. (Next: Further UI/UX improvements as needed).
*   **Caching Strategy (Redis):** ✅ DONE (Verified) - Installed `ioredis`. Created Redis client configuration (`apps/api/src/config/redis.ts`). Integrated Redis for refresh token management (`AuthService`), user profile caching (`MatchingService`), etc. **Update:** Verified `REDIS_URL` is correctly set in `.env`. Confirmed `AuthService` calls in `index.ts` are active. Restarted API server (`pnpm run dev`) and observed successful Redis client initialization logs ("AuthService initialized...", "Matching Service initialized..."). (Next: Manually test auth mutations and caching features for full verification. Further optimization/invalidation strategies TBD).
*   **Environments & Testing Strategy:** ✅ DONE (DB Isolation) - Defined Dev, Staging, Prod environments. Using isolated database for Dev. (Mock data script is PENDING).
    *   **IMPORTANT NOTE:** This rewrite project uses its own `.env` file located in the project root (`C:/Users/matti/Desktop/EntwineRewrite/.env`). Configuration values (Database URLs, API Keys, JWT Secrets) in this file pertain **only** to the rewrite project and its dedicated services (like the new development database). Do **not** confuse this with the `.env` file or services used by the original application located elsewhere. Ensure all credentials used here are intended for this separate rewrite environment.
*   **Matching & Ranking Service:** ✅ DONE (Implementation Complete), ✅ DONE (Expanded Test Coverage), ✅ DONE (Swipe Recording Added) - Implemented core service logic in `apps/api/src/modules/matching/matching.service.ts`, including fetching users, preference filtering, dealbreaker checks, location/distance filtering (Haversine), multi-dimensional scoring, and AI integration (via `AIService`) for communication style and physical preference alignment. **Updates:** Added swipe recording functionality (DB schema update, service logic, GraphQL mutation, push notifications on match). Updated GraphQL resolver (`matching.resolver.ts`). Created initial test suite (`matching.service.test.ts`) and significantly expanded coverage, including tests for filtering, sorting, limits, reciprocity, Jaccard calculations, AI errors, missing data, score clamping, and weight normalization. (Next: Monitor performance, add integration tests if needed).
*   **AI Coaching Service:** ✅ DONE (Core Logic + Interactive Feedback + Resolver History Fetching) - Implemented core service logic in `apps/api/src/modules/coaching/coaching.service.ts`, including dynamic config loading, registration Q&A flow (`handleRegistrationTurn`), and post-session analysis (`analyzeRegistrationConversation` with DB updates for `userValues` and `communicationStyles`). Replaced placeholder `getInChatSuggestions` with `getFeedbackForChat` supporting interactive feedback requests ('RECENT', 'FULL', 'DRAFT'). Updated GraphQL schema (`requestChatFeedback` mutation) and resolver (`coaching.resolver.ts`), replacing placeholder chat history fetching with actual Drizzle DB queries. Added comprehensive unit tests (`coaching.service.test.ts`).
*   **AI Abstraction Layer & Model Selection:** ✅ DONE (Google Provider + Dynamic Selection)
    *   ✅ Defined **Simplified Interface** (`apps/api/src/ai/ai-interface.ts`) with `generateChatCompletion`, `analyzeImage`, `countTokens`.
    *   ✅ Implemented **Provider Pattern** for Google Gemini (`apps/api/src/ai/google.provider.ts`), adhering to the interface. Includes basic error handling and token counting fallback logic.
    *   ✅ Store **per-feature AI configuration** (provider, model name) in the database. (Schema `ai_feature_configs` created, migration `0001` applied).
    *   ✅ Implemented **dynamic provider selection** in `AIService` (`apps/api/src/ai/ai.service.ts`). Fetches config, instantiates/caches providers based on `providerName`. Verified with unit tests (`ai.service.test.ts`).
    *   ✅ Manage **API keys** securely (reads from `process.env`).
*   **Admin Console:** ✅ IN PROGRESS (AI Config UI Complete, User Management - List View with Pagination Complete, User Detail View Complete, Login Fixed)
    *   **AI Config:** Implemented the UI for selecting AI provider/model per feature (`apps/web/app/admin/ai-config/page.tsx`). Backend includes GraphQL schema (`admin.graphql`), resolvers (`admin.resolver.ts`), and server integration for `getAiFeatureConfigs`, `updateAiFeatureConfig`, and `getAvailableAiProviders`. Frontend setup included codegen, query/mutation documents (`admin.gql`), and UI using Shadcn components. Auth handled via `AdminRouteGuard`.
    *   **User Management (List View):**
        *   **Backend (`apps/api`):**
            *   Added `role` column to `users` table (`packages/shared/src/schema.ts`) with `userRoleEnum` ('USER', 'ADMIN') and generated/applied migration (`0004_faulty_sunfire.sql`).
            *   Added `email`, `role`, `registrationStep` fields to `User` type (`graphql/schemas/user.graphql`).
            *   Added `AdminUser` and `AdminUserList` types to `graphql/schemas/admin.graphql`.
            *   Added `getAdminUsers` and `getAdminUser` queries to `graphql/schemas/admin.graphql`.
            *   Implemented resolvers for these queries in `graphql/resolvers/admin.resolver.ts` (including DB fetch, pagination args, ID type conversion).
            *   Added `chat.graphql` schema (defining `Message` type and `getMessagesForMatch` query) and `chat.resolver.ts` to fix a codegen validation error related to an incorrect frontend query (`GET_MESSAGES_QUERY`). Updated `index.ts` to load the chat schema/resolver.
        *   **Frontend (`apps/web`):**
            *   Created user management page component (`app/admin/users/page.tsx`).
            *   Added `GET_ADMIN_USERS` query to `graphql/queries.ts`.
            *   Added `Badge` component via Shadcn CLI (`pnpm dlx shadcn@latest add badge`).
            *   Updated `codegen.ts` to load schema from backend files (instead of introspection endpoint) and to scan `.ts`/`.tsx` files for GraphQL operations.
            *   Fixed validation errors during codegen by:
                *   Removing duplicate `Login` mutation definition.
                *   Correcting `refreshToken` mutation argument name.
                *   Updating `ME_QUERY` to use `firstName`/`lastName` instead of `name`.
                *   Updating `User` interface in `AuthContext.tsx`.
                *   Correcting `GET_MESSAGES_QUERY` to use `getMessagesForMatch`.
            *   Successfully ran codegen (`pnpm --filter web run codegen`).
            *   Updated `app/admin/users/page.tsx` to use `useGetAdminUsersQuery` hook and display user list (ID, Name, Role, Profile Status, Created At) in a Shadcn UI `Table`.
            *   Implemented pagination controls (Previous/Next buttons, page info) in `app/admin/users/page.tsx` using `useState` and updating `useGetAdminUsersQuery` variables (`offset`, `limit`). Backend resolver already supported pagination arguments.
    *   **Login Troubleshooting:** ✅ DONE (Fixed) - Addressed several build errors related to Tailwind CSS config (`@tailwindcss/postcss`) and Next.js Client/Server component boundaries (`'use client'` directive, provider pattern). Updated backend `AuthService` and GraphQL schema/mutations to ensure the `user` object is returned upon successful login. Added a dedicated admin user to the seed script (`apps/api/src/scripts/seed.ts`). **Resolved connection issues** by correcting API port in frontend config (`apps/web/lib/apolloClient.ts` from 4000 to 4001). **Resolved redirection issue** by adding `useEffect` hook to login page (`apps/web/app/login/page.tsx`) to redirect based on user role after successful authentication.
    *   **User Management (Detail View):** ✅ DONE - Created detail page component (`apps/web/app/admin/users/[userId]/page.tsx`) using Next.js dynamic routes. Added `GET_ADMIN_USER` query (`apps/web/graphql/queries.ts`) and generated hook. Fixed codegen duplicate operation name (`Login` -> `LoginUser` in `apps/web/graphql/auth.gql.ts`). Added `Skeleton` component and `date-fns` dependency. Linked user list IDs (`apps/web/app/admin/users/page.tsx`) to the detail page.
    *   **(Updated Plan & Scope):** Based on review of the original application's admin capabilities, the full scope for the Admin Console now includes:
        *   **Reference:** The structure and components of the original application's admin interface (located in `OLD APP - Not for coding - just for reference/SoulConnectionPlatform/client/src/components/admin/` and related files) can be consulted for implementation details and feature parity.

        *   **User Management:**
            *   List Users (Done)
            *   View User Details (Done)
            *   *New:* Edit User Details (e.g., profile info, role) ✅ DONE (Backend + Frontend Modal/Logic)
            *   *New:* Disable/Enable User Accounts ✅ DONE (Backend + Frontend Button/Logic)
            *   *New:* User Impersonation (Log in as a specific user) ✅ DONE (Backend + Frontend Button/Logic)
        *   **Content Moderation:** *(New - Planned in v6)*
            *   Review reported content (users, photos, messages).
            *   Take actions (warn, suspend, ban, remove content).
        *   **Analytics Views:** *(New - Planned in v6)*
            *   Dashboard with key metrics (user signups, active users, message volume, etc.).
            *   Potentially specific reports (e.g., user demographics, feature usage).
        *   **Rating Photo Management:** *(New - From Old App)*
            *   Manage stock photos used for the registration rating step (CRUD, AI analysis config).
        *   **Intro Screens Management:** *(New - From Old App)*
            *   View, create, edit, and delete the introductory screens shown during user registration.
        *   **System Configuration:** *(New - From Old App)*
            *   Manage system-wide settings (Matching Algo weights, Registration Rules, Communication Rules, etc.).
        *   **AI Management:**
            *   AI Model Configuration per Feature (Done)
            *   *New - From Old App:* AI Personas (CRUD, activation, directives)
            *   *New - From Old App:* AI Coach Configuration (CRUD, activation, question management)
        *   **Tools:**
            *   *New - Planned in v6:* Batch Operations (Define/execute actions on user segments).
            *   *(User Impersonation might also live here or under Users)*

    *   **Proposed Structure & Navigation:**
        ```mermaid
        graph TD
            AdminConsole[Admin Console] --> Nav[Sidebar Navigation]

            Nav --> Users[Users]
            Users --> UserList[User List (View)]
            Users --> UserDetail[User Detail (View)]
            UserList --> UserActionsList[(Edit / Disable / Impersonate)]
            UserDetail --> UserActionsDetail[(Edit / Disable / Impersonate)]

            Nav --> Moderation[Content Moderation]
            Moderation --> ReportedQueue[Reported Content Queue]
            Moderation --> ModActions[Moderation Actions]

            Nav --> Analytics[Analytics]
            Analytics --> UsageStats[Usage Statistics]
            Analytics --> Demographics[User Demographics]

            Nav --> AppConfig[App Configuration]
            AppConfig --> SystemSettings[System Settings]
            AppConfig --> IntroScreens[Intro Screens]
            AppConfig --> RatingPhotos[Rating Photos]

            Nav --> AIConfig[AI Management]
            AIConfig --> AIModels[AI Model Selection (Existing)]
            AIConfig --> AIPersonas[AI Personas]
            AIConfig --> AICoach[AI Coach Configs]

            Nav --> Tools[Tools]
            Tools --> BatchOps[Batch Operations]
            Tools --> ImpersonationTool[User Impersonation]

            %% Styling
            classDef section fill:#f9f,stroke:#333,stroke-width:2px;
            class Nav,Users,Moderation,Analytics,AppConfig,AIConfig,Tools section;
        ```

    *   **Implementation Details (Remaining Features):**
        *   **User Management (Enhancements):** Add forms/modals for editing, buttons/toggles for activation status, and backend logic/endpoints for impersonation tokens.
        *   **Content Moderation:** Define reporting schema/API. Build UI queue and action controls. Implement backend logic for moderation actions.
        *   **Analytics Views:** Develop backend aggregation queries. Implement frontend dashboard with charting libraries.
        *   **Rating Photo Management:** Backend CRUD API for `ratingPhotos`, handle uploads, trigger/store AI analysis. Frontend UI for management, filtering, upload, and config.
        *   **Intro Screens Management:** Backend CRUD API for `introScreens`. Frontend UI for listing and form-based editing.
        *   **System Configuration:** Backend API to get/set various config values. Frontend forms with appropriate controls.
        *   **AI Persona Management:** Backend CRUD API for `aiPersonas`. Frontend UI for table view, filtering, forms, batch operations.
        *   **AI Coach Configuration:** Backend CRUD API for `coachConfigs` and nested questions/replies. Frontend UI for listing and form-based management.
        *   **Batch Operations:** Define operations, implement backend job triggering/monitoring (consider queues). Frontend UI for segment definition, operation selection/config, and progress display.
    *   **(Next:** Implement edit/disable actions, Content Moderation, Analytics Views, etc.).
*   **Security:** ✅ DONE (Codegen Fixed, Zod Validation Added, Basic Auth Directive Implemented, Rate Limiting Added) - Integrated input validation using Zod for `sendRegistrationCoachMessage`, `requestChatFeedback`, and `getPotentialMatches` GraphQL operations. Zod schemas defined in `@entwine-rewrite/shared`. Implemented a basic `@auth` directive (`apps/api/src/graphql/directives/auth.directive.ts`) to protect GraphQL fields/queries based on JWT authentication context (`context.user`). Applied directive transformer in `index.ts` and added `@auth` to the `me` query (`user.graphql`). Created placeholder `me` resolver (`user.resolver.ts`). **Note on `graphql-codegen`:** Resolved persistent errors preventing type generation. The root cause involved the codegen tool requiring the base `Mutation` type in `schema.graphql` to have at least one field defined for successful merging with `extend type Mutation` blocks. Added a dummy `_empty: Boolean` field to `schema.graphql` to fix this. Codegen now runs successfully, generating types in `apps/api/src/graphql/generated/graphql.ts`. **Updates:** Implemented rate limiting using `express-rate-limit`. Confirmed admin authorization checks are in place. (Next: Implement more granular authorization (roles/permissions) if needed). (Basic JWT structure is in place).

### 6.3 UI/UX Modernization ✅ DONE

*   **Objective:** Address user feedback regarding the outdated ("1995 web page") feel of the web application (`apps/web/`).
*   **Process:**
    1.  **Analysis & Design:** Delegated to `UI/UX Design` mode for analysis and recommendations.
    2.  **Implementation (Delegated to `Code` mode):**
        *   Refined core design system (`globals.css`, `tailwind.config.ts`): Updated colors, typography, spacing, and added base transition variables.
        *   Redesigned core UI components (`apps/web/components/ui/`): Updated `Input`, `Button`, `Card`, `Header` (in `AppLayout.tsx`), `Textarea`, `Checkbox`, `RadioGroup`, `Select`, `Slider` with new styles, gradients, focus/hover/active states.
        *   Improved page-specific layouts:
            *   Authentication (`login`, `signup`): Implemented split-screen layout.
            *   Registration (`register`): Added visual progress indicator, updated step layouts using `Card`, implemented modern photo upload UI.
            *   Chat (`Step5_AIPersonaChat.tsx`): Refactored layout (header, messages, input), updated message bubble styling, integrated revised input/button.
        *   Applied micro-interactions: Added consistent CSS transitions and subtle feedback animations (e.g., button scale) to core components.
*   **Outcome:** Significantly modernized the look, feel, and responsiveness of the web application's user interface.


## 7. Development Process & Tooling
### 7.1 Local Development Environment (Docker Compose) ✅ DONE

Docker Compose is now used to manage the local development stack, including the API (`api`), web frontend (`web`), and Redis (`redis`) services. This simplifies setup and ensures consistency across development environments.

**Key Configuration Files:**

*   `docker-compose.yml` (Project Root)
*   `apps/api/Dockerfile`
*   `apps/web/Dockerfile`
*   `.dockerignore` (Project Root)

**Usage Instructions:**

*   **Prerequisites:** Ensure Docker Desktop (or equivalent Docker engine) is installed and running.
*   **Build & Start:** To build the images (if they don't exist or need updating) and start all services in detached mode (running in the background), use:
    ```bash
    docker-compose up --build -d
    ```
*   **Stop:** To stop and remove the containers, networks, and volumes created by `up`, use:
    ```bash
    docker-compose down
    ```
*   **View Logs:** To view the logs from all services and follow new output:
    ```bash
    docker-compose logs -f
    ```
    To view logs for a specific service (e.g., `web`):
    ```bash
    docker-compose logs -f web
    ```
*   **Access Points:**
    *   Web Application: `http://localhost:3000`
    *   API GraphQL Endpoint: `http://localhost:4001/graphql` (Useful for tools like Apollo Studio)



*   **Testing:** ✅ DONE (Coaching & Matching Service Tests Expanded) - Installed Jest, `@types/jest`, `@jest/globals`, `ts-jest`, `cross-env`, `dedent`. Configured Jest for ESM/NodeNext (`apps/api/jest.config.js`, `apps/api/package.json` test script). Created unit tests for `GoogleProvider` (`google.provider.test.ts`) and `AIService` (`ai.service.test.ts`). Created comprehensive unit tests for `CoachingService` (`coaching.service.test.ts`), covering all methods including the new `getFeedbackForChat`. Fixed pre-existing failures and significantly expanded test coverage for `MatchingService` (`matching.service.test.ts`).
    *   **API Testing Infrastructure (`apps/api`):** ✅ DONE (Setup & Validation)
        *   Reviewed existing Jest setup.
        *   Installed Supertest for integration testing.
        *   Implemented Testcontainers (`@testcontainers/postgresql`, `testcontainers`) for managing ephemeral Postgres and Redis instances during tests.
        *   Created Jest global setup (`jest.globalSetup.ts`) to:
            *   Start Postgres and Redis containers.
    *   **Web Testing Infrastructure (`apps/web`):** ✅ DONE (Setup & Validation)
    *   **Error Handling / Logging:** ✅ DONE (Standardized API Logging), ✅ DONE (Specific GraphQL Errors) - Replaced `console.log`/`console.error` with structured `logger` calls in core API services (`auth`, `ai`), resolvers (`auth`, `admin`, `chat`, `coaching`, `matching`, `notifications`, `user`), entry point (`index.ts`), and Passport config (`passport.ts`). Left `console` calls in test utilities and standalone scripts. **Updates:** Refactored error handling across major resolvers to use specific `GraphQLError` types instead of generic `Error`.
    *   **TODO Cleanup:** ✅ DONE (Addressed Core Items & Finalization Cleanup) - Implemented missing `verifyAccessToken` method in `AuthService`. Added generated GraphQL types to `coaching.resolver.ts`. Deferred TODOs related to new features (e.g., blocking, push token management) or minor refinements. Addressed various remaining TODOs and performed general cleanup during API finalization.
        *   Installed Jest, React Testing Library (RTL), and Playwright dependencies.
        *   Installed Playwright browser binaries.
        *   Created Jest config (`jest.config.js`) using `next/jest` preset, configured environment, path aliases, and CSS module mocking.
        *   Created Jest setup file (`jest.setup.js`) to import Jest DOM matchers.
        *   Created Playwright config (`playwright.config.ts`) defining test directory and base URL.
        *   Added test scripts (`test`, `test:watch`, `test:cov`, `test:e2e`) to `package.json`.
        *   Wrote and verified initial component test (`logo.test.tsx`) using Jest/RTL.
        *   Wrote and verified initial E2E test (`e2e/homepage.spec.ts`) using Playwright, confirming unauthenticated redirect behavior.
            *   Apply database schema using programmatic Drizzle ORM migrations (`drizzle-orm/node-postgres/migrator`).
            *   Set environment variables (`TEST_DATABASE_URL`, `TEST_REDIS_URL`).
            *   Write container IDs to temporary files for teardown.
        *   Created Jest global teardown (`jest.globalTeardown.ts`) to clean up temporary container ID files.
        *   Configured Jest (`jest.config.js`) to use global setup/teardown and handle module path aliases (`@/`).
        *   Refactored API entry point (`index.ts`) to export an `initializeApp` function for testability.
        *   Adapted database (`db/index.ts`) and Redis (`config/redis.ts`) connection logic to prioritize test environment variables.
        *   Created database seeding/cleanup utilities (`test-utils/seed.ts`).
        *   Wrote initial unit (`utils/math.test.ts`) and integration (`modules/health/health.integration.test.ts`) tests.
        *   Integrated seeding/cleanup into `modules/matching/matching.service.test.ts` and debugged existing tests to ensure the entire suite passes against the test infrastructure.
            *   **Debugging Journey:** Resolved several infrastructure setup issues through iterative debugging, including: initial Drizzle Kit migration failures (`_journal.json not found`, invalid flags, silent `push:pg` failures) eventually addressed by switching to programmatic Drizzle ORM migrations; Testcontainers setup for both Postgres and Redis; Jest configuration for path aliases (`moduleNameMapper`); refactoring the API entry point (`index.ts` -> `initializeApp`) for testability; implementing and refining database seeding/cleanup utilities (`seed.ts`); and fixing test logic in `matching.service.test.ts` to work with the live test database.
    *   **Note on Jest/ESM Configuration:** Setting up Jest with `ts-jest` for a `NodeNext` (ESM) project required specific configuration and troubleshooting:
        *   Using `cross-env` to set `NODE_OPTIONS=--experimental-vm-modules` in the test script is crucial.
        *   The standard `'ts-jest'` preset was ultimately used.
        *   Explicit imports from `@jest/globals` (e.g., `describe`, `it`, `expect`, `jest`) were necessary.
        *   Mocking local modules (`jest.mock('./module')`) required careful handling, especially with module-level caches. Exporting the cache (`providerCache` from `ai.service.ts`) and clearing it in `beforeEach` proved effective for testing caching logic reliably across test runs.
        *   Editor (VS Code) TypeScript analysis might still show spurious errors related to Jest globals or relative paths even when tests pass; restarting the TS server or ignoring these specific editor errors might be needed.
    *   (Next: Write more unit/integration tests for other services, AI providers, resolvers. Set up E2E framework).
*   **Mock Data Seeding:** ✅ DONE (Script Expanded & Executed for Dev) - Added `@faker-js/faker` dev dependency to `apps/api`. Created initial seed script `apps/api/src/scripts/seed.ts` with basic user seeding logic. Added `DATABASE_URL_DEV` to `.env`. Expanded script to seed `datingPreferences`, `userPhotos`, `userInterests`, and `userValues`. Added `db:seed` script to `apps/api/package.json`. Successfully ran migrations and seed script against the development database (`DATABASE_URL_DEV`). (Next: Integrate into Dev/Staging setup if needed).
*   **CI/CD:** ✅ DONE (Initial GitHub Actions Setup) - Created `.github/workflows/ci.yml` to run lint and test jobs on push/PR to `main`. Added root `test` script to `package.json`. Connected local repo to GitHub remote (`origin https://github.com/joesjsu/EntwineRewrite.git`).
*   **Linting/Formatting:** ✅ DONE (Basic Setup) - ESLint/Prettier configured via Turborepo starter. (`lint` script exists).

## 8. Roo Assistance

*   Roo (Code Mode) can assist with: boilerplate generation, refactoring, test creation, schema changes, setup commands, migration scripts, implementing AI provider logic.
*   Roo (Architect Mode) can help refine plans, discuss trade-offs, and generate documentation/diagrams.

## 9. Documentation and Running Instructions

*   **Comprehensive README.md:** ✅ DONE - Created a detailed README.md with instructions for running and viewing both the web and mobile applications. Includes prerequisites, environment setup, running instructions, test accounts, and troubleshooting tips.