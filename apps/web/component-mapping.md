# Entwine Web/Mobile Component Mapping Guide

This document maps all major UI components and flows in the Entwine web client (`apps/web/`) to their mobile equivalents (or planned equivalents), ensuring design parity, accessibility, and shared design token usage. It also documents how the design token system supports future dynamic theming and cross-platform consistency.

---

## 1. Design Tokens & Theming

- **Source:** `tailwind.config.ts`, `app/globals.css`
- **Tokens:** Colors, radii, transitions, feedback states, chart colors, sidebar, etc.
- **Dynamic Theming:** All tokens are defined as CSS variables on `:root` and `.dark`, supporting light/dark mode and future dynamic theming.
- **Sharing:** Tokens can be exported to a shared TypeScript file for React Native (`packages/shared/` or `apps/mobile/`) to ensure parity.

---

## 2. Component Mapping Table

| Web Component (Path)                                   | Mobile Equivalent (Planned/Existing)         | Shared Tokens/Patterns         | Accessibility/Feedback Notes                |
|--------------------------------------------------------|----------------------------------------------|-------------------------------|---------------------------------------------|
| `components/ui/button.tsx`                             | `Button` (React Native Paper)                | `--primary`, `--radius`, etc. | Focus ring, keyboard nav, loading state     |
| `components/ui/input.tsx`                              | `TextInput` (React Native Paper)             | `--input`, `--radius`         | Label association, error state, a11y labels |
| `components/ui/card.tsx`                               | `Card` (React Native Paper)                  | `--card`, `--radius`          | Contrast, shadow, focusable                 |
| `components/ui/alert.tsx`, `alert-dialog.tsx`          | `Dialog`/`Snackbar` (React Native Paper)     | `--accent`, `--success`, etc. | ARIA roles, dismissable, live region        |
| `components/ui/badge.tsx`                              | `Badge` (React Native Paper)                 | `--accent`, `--radius`        | Color contrast, screen reader text          |
| `components/ui/progress.tsx`                           | `ProgressBar` (React Native Paper)           | `--primary`, `--success`      | ARIA progress, color for state              |
| `components/ui/skeleton.tsx`                           | `Skeleton` (custom/3rd party)                | `--muted`, `--radius`         | Animations, reduced motion                  |
| `components/ui/table.tsx`                              | `List`/`DataTable` (React Native Paper)      | `--card`, `--border`          | Row focus, a11y roles, responsive           |
| `app/components/ChatWindow.tsx`                        | `ChatScreen` (custom)                        | `--primary`, `--background`   | Live updates, typing, error, loading        |
| `app/components/MessageInput.tsx`                      | `MessageInput` (custom)                      | `--input`, `--radius`         | Send on enter, error, disabled, a11y        |
| `app/components/TypingIndicator.tsx`                   | `TypingIndicator` (custom)                   | `--muted`, `--info`           | Live region, animation, reduced motion      |
| `app/register/components/Step1_BasicProfileForm.tsx`   | `ProfileFormScreen`                          | `--input`, `--card`           | Field validation, error, focus, a11y        |
| `app/register/components/Step2_DatingPreferencesForm.tsx` | `PreferencesFormScreen`                    | `--input`, `--card`           | Range sliders, error, focus, a11y           |
| `app/register/components/Step3_PhotoRating.tsx`        | `PhotoRatingScreen`                          | `--card`, `--accent`          | Image alt, rating feedback, a11y            |
| `app/register/components/Step4_AICoachInteraction.tsx` | `AICoachScreen`                              | `--primary`, `--card`         | AI state, loading, error, a11y              |
| `app/register/components/Step5_AIPersonaChat.tsx`      | `AIPersonaChatScreen`                        | `--primary`, `--background`   | Persona indicator, progress, a11y           |
| `app/register/components/Step6_CompletionScreen.tsx`   | `CompletionScreen`                           | `--success`, `--card`         | Success feedback, confetti, a11y            |
| `app/admin/users/page.tsx`                             | `AdminUserListScreen`                        | `--table`, `--card`           | Pagination, focus, roles, a11y              |
| `app/admin/users/[userId]/page.tsx`                    | `AdminUserDetailScreen`                      | `--card`, `--badge`           | Detail, edit, impersonate, a11y             |
| ...                                                    | ...                                          | ...                           | ...                                         |

*For a full list, see the source directories. All components use shared tokens and follow the same design system.*

---

## 3. Accessibility & Feedback

- **Accessibility:** All components are built to WCAG 2.1 AA standards (color contrast, keyboard navigation, ARIA roles, focus management).
- **Feedback States:** Loading, error, success, and real-time/AI states are handled via standardized tokens and UI patterns (spinners, skeletons, alerts, banners).
- **Reduced Motion:** Animations respect user `prefers-reduced-motion`.

---

## 4. Real-Time & Backend Integration

- **GraphQL:** All data flows use Apollo Client with loading/error/success states surfaced in the UI.
- **Socket.IO:** Real-time events (chat, typing, match) update UI instantly, with feedback for connection status and errors.
- **AI States:** AI interactions show progress, loading, and error states, using tokens for visual feedback.

---

## 5. Dynamic Theming & Future Parity

- **Dynamic Theming:** All tokens are CSS variables, ready for runtime theme switching.
- **Mobile Parity:** Tokens and patterns are structured for export to React Native (see `packages/shared/` for future token exports).
- **Component Parity:** This mapping ensures all user flows and UI elements are consistent across web and mobile.

---

## 6. References

- **Design Tokens:** `tailwind.config.ts`, `app/globals.css`
- **UI/UX Screenshots:** `/UI Screenshots/`
- **Mobile Plan:** `entwine_mobile_app_interface_plan.md`
- **Registration Flow:** `docs/registration_flow_frontend_plan.md`
- **Backend Integration:** See GraphQL queries/mutations in `graphql/`, Apollo setup in `lib/apolloClient.ts`

---

*This guide is a living document. Update as new components or flows are added to maintain parity and consistency.*