# Entwine Mobile App

This is the React Native mobile app for Entwine, a relationship platform that uses AI to help users find meaningful connections.

## Setup

### Prerequisites

- Node.js (LTS version)
- pnpm
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Install iOS pods (macOS only):
```bash
cd ios && pod install && cd ..
```

### Running the App

#### iOS (macOS only)

```bash
pnpm ios
```

#### Android

```bash
pnpm android
```

#### Start Metro Bundler

```bash
pnpm start
```

## Project Structure

```
apps/mobile/
├── src/
│   ├── assets/              # Images, fonts, etc.
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Shared components
│   │   ├── auth/            # Auth-related components
│   │   ├── registration/    # Registration components
│   │   ├── home/            # Home/Matches components
│   │   ├── chat/            # Chat components
│   │   └── profile/         # Profile components
│   ├── contexts/            # Context providers
│   │   ├── AuthContext.tsx  # Authentication context
│   │   ├── SocketContext.tsx # Socket.IO context
│   │   └── ThemeContext.tsx # Theming context
│   ├── hooks/               # Custom hooks
│   ├── navigation/          # Navigation configuration
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   ├── RegistrationNavigator.tsx
│   │   └── RootNavigator.tsx
│   ├── screens/             # Screen components
│   │   ├── auth/            # Auth screens
│   │   ├── registration/    # Registration screens
│   │   ├── home/            # Home/Matches screens
│   │   ├── chat/            # Chat screens
│   │   └── profile/         # Profile screens
│   ├── services/            # API and other services
│   │   ├── api/             # API integration
│   │   ├── push/            # Push notification handling
│   │   └── location/        # Location services
│   ├── theme/               # Theming configuration
│   └── utils/               # Utility functions
├── App.tsx                  # Root component
└── index.js                 # Entry point
```

## Key Features

- **Authentication**: Login, signup, and password recovery
- **Registration Flow**: Multi-step registration process
  - Basic profile information
  - Dating preferences
  - Photo rating
  - AI coach interaction
  - AI persona chats
- **Matching**: View and interact with potential matches
- **Chat**: Real-time messaging with matches
- **Profile Management**: View and edit profile information

## Mobile-Specific Features

- **Push Notifications**: Receive notifications for new matches, messages, etc.
- **Camera Integration**: Take photos directly within the app
- **Location Services**: Find matches based on proximity
- **Gesture Navigation**: Swipe-based interactions for matching

## Shared Code

This app shares code with the web app through the `packages/shared` directory:

- Data models and TypeScript interfaces
- Validation schemas (Zod)
- GraphQL operations
- Utility functions

## Technology Stack

- **Framework**: React Native
- **Language**: TypeScript
- **UI Components**: React Native Paper
- **Navigation**: React Navigation
- **State Management**: Context API
- **API Integration**: Apollo Client (GraphQL)
- **Real-time Communication**: Socket.IO