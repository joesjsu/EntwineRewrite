# Entwine Web App: Registration Flow Frontend Implementation Plan (v3 - Intra-Step Saving)

**Version:** 3 (Includes Intra-Step Saving)
**Date:** 2025-04-11

**1. Goal:**
This plan outlines the frontend implementation strategy for the multi-step user registration flow within the `apps/web` (Next.js/React/TypeScript) application, as defined in `entwine_rewrite_plan_v6.md` (Section 6.1). The goal is to create a guided, responsive experience for new users, ensuring progress is saved frequently *within* each step (e.g., on field blur, message send) to allow users to resume with minimal data loss. This requires corresponding backend support for partial data persistence.

**2. Routing Strategy:**

*   **Approach:** Utilize a single primary route, `/register`, managed by a dedicated Next.js App Router page (`apps/web/app/register/page.tsx`). This page component acts as a container and conditionally renders the appropriate UI for the user's current registration step.
*   **Fetching User State:** The `RegisterPage` component uses the `useAuth()` hook from `AuthContext` (`apps/web/context/AuthContext.tsx`) to access the authenticated user's state, specifically the `user.registrationStep` field.
*   **Conditional Rendering:**
    *   The `RegisterPage` contains logic (e.g., a `switch` statement or nested conditional rendering) based on the `user.registrationStep` value (0 through 6).
    *   Each case renders the corresponding step-specific component.
*   **Handling Edge Cases:**
    *   **Loading State:** Display a loading indicator (e.g., `Spinner`) while `AuthContext` initializes or fetches data.
    *   **No User/Not Signed Up:** Redirect users with `user === null` (after loading) to `/login`. Assume Step 0 (Initial Signup) happens via `/signup`, which redirects to `/register` on success.
    *   **Registration Complete:** Redirect users with `user.profileComplete === true` away from `/register` to the main dashboard (e.g., `/`).
    *   **Resuming Registration:** Logged-in users navigating to `/register` will be shown the correct step based on their `registrationStep`. Fetching partially saved data occurs within the specific step component upon loading.

**3. Component Structure:**

*   **Main Directory:** `apps/web/app/register/`
*   **Page Component:** `apps/web/app/register/page.tsx` (Handles routing logic)
*   **Step Components Directory:** `apps/web/app/register/components/`
*   **Key Components:**
    *   `RegistrationContainer.tsx`: Layout wrapper, consistent padding, optional header/footer, visual progress indicator (Stepper).
    *   `Step0_SignupForm.tsx`: (Likely in `apps/web/app/signup/`) Handles initial credentials, redirects to `/register`.
    *   `Step1_BasicProfileForm.tsx`: Form for birthday, location, bio, profile photo upload. Handles partial data loading/saving.
    *   `Step2_DatingPreferencesForm.tsx`: Form for match preferences. Handles partial data loading/saving.
    *   `Step3_PhotoRating.tsx`: Interface to display and rate photos. Handles partial data loading/saving (individual ratings).
    *   `Step4_AICoachChat.tsx`: Chat interface for AI Coach. Handles message loading/saving.
    *   `Step5_AIPersonaChat.tsx`: Chat interface for 6 AI Personas. Manages persona state, message counts (from saved data), navigation, message loading/saving.
    *   `Step6_CompletionScreen.tsx`: Confirmation message upon completing the final step.
*   **Shared Components:** Leverage existing (`MessageInput`, `TypingIndicator`) and Shadcn UI library.

```mermaid
graph TD
    A[/signup] -- Signup Success --> B[/register];
    B -- Reads user.registrationStep --> C{Render Step};
    C -- registrationStep = 1 --> D[Step1_BasicProfileForm];
    C -- registrationStep = 2 --> E[Step2_DatingPreferencesForm];
    C -- registrationStep = 3 --> F[Step3_PhotoRating];
    C -- registrationStep = 4 --> G[Step4_AICoachChat];
    C -- registrationStep = 5 --> H[Step5_AIPersonaChat];
    C -- registrationStep = 6 --> I[Step6_CompletionScreen];
    D -- Loads/Saves Partial Data --> D;
    D -- Submit (Final) --> B;
    E -- Loads/Saves Partial Data --> E;
    E -- Submit (Final) --> B;
    F -- Loads/Saves Partial Data --> F;
    F -- Submit (Final) --> B;
    G -- Loads/Saves Messages --> G;
    G -- Submit (Final) --> B;
    H -- Loads/Saves Messages --> H;
    H -- Submit (Final) --> B;
    I -- Finish --> J[/dashboard];

    subgraph /register Page Logic
        B
        C
        D
        E
        F
        G
        H
        I
    end

    style B fill:#f9f,stroke:#333,stroke-width:2px
```

**4. State Management (Intra-Step Saving):**

*   **Global Step Progress:** `user.registrationStep` in `AuthContext` tracks the *last completed major step*.
*   **Fetching Partial State:** Upon mounting, each step component (1-5) attempts to fetch previously saved partial data using dedicated queries.
*   **Form Data (Steps 1, 2):**
    *   Use local state (`useState`, `react-hook-form`).
    *   Trigger partial save mutations on field `onBlur` or via debounced `onChange`.
    *   Manage saving state (`isSaving`, `saveError`) per field/section.
*   **Photo Rating (Step 3):**
    *   Local state manages current photo index and fetched rated photos.
    *   Trigger mutation to save specific rating immediately on interaction.
*   **AI Chats (Steps 4, 5):**
    *   Local state manages fetched/new conversation history, input, loading states.
    *   Trigger mutation to save user message and AI response on send/receive.
    *   Step 5: `currentPersonaIndex`, `messageCountPerPersona` (derived from saved history).
*   **Sub-step Completion (Step 5):** Tracked via message count from saved messages. "Next Persona" enabled when count >= 6. Final `completePersonaChatsMutation` triggered after 6th persona.
*   **Final Step Submission:** Main "Next"/"Submit" button triggers mutation to update global `registrationStep`.

**5. API Integration (Requires Backend Implementation):**

*   **General:** `ME_QUERY`
*   **Fetching Partial State (New/Modified Queries Needed):**
    *   `getPartialUserProfileQuery`: Fetches saved fields for Step 1.
    *   `getPartialUserPreferencesQuery`: Fetches saved fields for Step 2.
    *   `getSavedPhotoRatingsQuery`: Fetches individual ratings for Step 3.
    *   `getCoachConversationQuery`: Fetches saved messages for Step 4.
    *   `getPersonaConversationQuery(personaId: ID!)`: Fetches saved messages for Step 5.
*   **Saving Partial State (New/Modified Mutations Needed):**
    *   `saveUserProfilePartialMutation(input: UserProfilePartialInput!)`: Saves fields from Step 1.
    *   `saveUserPreferencesPartialMutation(input: UserPreferencesPartialInput!)`: Saves fields from Step 2.
    *   `savePhotoRatingMutation(input: PhotoRatingInput!)`: Saves a single photo rating for Step 3.
    *   `saveCoachMessageMutation(input: SaveMessageInput!)`: Saves messages for Step 4.
    *   `savePersonaChatMessageMutation(input: SavePersonaMessageInput!)`: Saves messages for Step 5.
*   **Completing Major Steps (Existing Mutations - Triggered by Final Submit):**
    *   `updateUserProfileMutation` / `updateUserPreferencesMutation` / `submitPhotoRatingsMutation` / `completeCoachInteractionMutation` / `completePersonaChatsMutation`: Triggered by final step submission to update `registrationStep`.

**6. UI/UX Considerations:**

*   **Overall:**
    *   `RegistrationContainer`: Use `Card`. Implement `Stepper` component.
    *   Consistent `Button` usage (Next, Back, Submit). Disable during loading.
    *   Use Shadcn form components. Style consistently, reference old UI for layout inspiration.
    *   Use `Skeleton` for loading.
    *   Use `Alert`/`AlertDescription` for errors.
    *   **Responsiveness:** Ensure full responsiveness using Tailwind CSS utility classes. Test on various viewports.
*   **Intra-Step Saving Indicators:**
    *   Provide subtle feedback on partial saves (e.g., brief checkmark/spinner).
    *   Handle partial save errors gracefully (e.g., message near field, retry option).
*   **Step 1 (Basic Profile):** Structure form, group fields. Prominent photo upload with preview (`Avatar`/`img`). Fields save on blur/debounce.
*   **Step 2 (Preferences):** Use appropriate controls (`Slider`, `RadioGroup`, etc.). Organize logically. Fields save on blur/debounce.
*   **Step 3 (Photo Rating):** Display photos clearly. Intuitive rating controls (`Button`s/stars). Show progress. Rating saved immediately.
*   **Step 4 (AI Coach):** Chat interface (`ScrollArea`, styled messages, `Avatar`, `MessageInput`). Display intro. Messages saved on send/receive.
*   **Step 5 (AI Personas):** Similar chat interface. Prominent "Persona X of 6" indicator. Clear message progress ("Y / 6") using `Progress` or text. Conditional "Next Persona" `Button`. Messages saved on send/receive.
*   **Step 6 (Completion):** Simple `Card` with confirmation text and `Button` linking to dashboard.