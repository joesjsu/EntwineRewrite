# Entwine App: Running & Viewing Instructions

This document provides comprehensive instructions for running and viewing the Entwine application, including both the web and mobile interfaces.

## Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (LTS version, 18 or higher)
- **pnpm** (version 9.0.0)
- **PostgreSQL** (for local development)
- **Redis** (for caching and session management)

## Environment Setup

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/joesjsu/EntwineRewrite.git
   cd EntwineRewrite
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the project root with the following variables:
   ```
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/entwine
   DATABASE_URL_DEV=postgresql://username:password@localhost:5432/entwine_dev
   
   # Redis
   REDIS_URL=redis://localhost:6379
   
   # JWT
   JWT_SECRET=your_jwt_secret_here
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
   
   # AI Providers (if needed)
   GOOGLE_API_KEY=your_google_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Set up the database:
   ```bash
   # Run migrations
   pnpm --filter @entwine-rewrite/api run db:migrate
   
   # Seed the database with test data (optional, for development)
   pnpm --filter @entwine-rewrite/api run db:seed
   ```

## Running the Web Application

### Starting the API Server

1. Start the API server:
   ```bash
   pnpm --filter @entwine-rewrite/api run dev
   ```
   
   This will start the GraphQL API server on port 4001. You can access the GraphQL Playground at http://localhost:4001/graphql

### Starting the Web Client

1. In a new terminal, start the web client:
   ```bash
   pnpm --filter web run dev
   ```
   
   This will start the Next.js development server on port 3000. You can access the web application at http://localhost:3000

### Running Both API and Web Client Together

You can run both the API and web client simultaneously using Turborepo:

```bash
pnpm run dev
```

## Accessing the Web Application

Once the application is running, you can access the following routes:

- **Login**: http://localhost:3000/login
- **Signup**: http://localhost:3000/signup
- **Registration Flow**: http://localhost:3000/register
  - The registration flow consists of 6 steps:
    1. Basic Profile Form
    2. Dating Preferences Form
    3. Photo Rating Interface
    4. AI Coach Interaction
    5. AI Persona Chat
    6. Completion Screen
- **Main Dashboard**: http://localhost:3000/ (requires authentication)
- **Chat**: http://localhost:3000/chat/:id (requires authentication)
- **Profile**: http://localhost:3000/profile (requires authentication)
- **Admin Console**: http://localhost:3000/admin (requires admin role)

### Test Accounts

If you've run the seed script, you can use the following test accounts:

- **Regular User**:
  - Email: user@example.com
  - Password: password123

- **Admin User**:
  - Email: admin@example.com
  - Password: admin123

## Running the Mobile Application

### Prerequisites for Mobile Development

- **React Native CLI** installed globally
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)
- **Android emulator** or physical device
- **iOS simulator** or physical device (macOS only)

### Setting up the Mobile Environment

1. Create a `.env` file in the `apps/mobile` directory based on the `.env.example`:
   ```
   # API Configuration
   API_URL=http://localhost:4001
   GRAPHQL_URL=http://localhost:4001/graphql
   SOCKET_URL=http://localhost:4001
   
   # Feature Flags
   ENABLE_PUSH_NOTIFICATIONS=true
   ENABLE_ANALYTICS=true
   
   # App Configuration
   APP_NAME=Entwine
   APP_VERSION=0.1.0
   ```

   > **Note for physical devices**: If you're using a physical device, replace `localhost` with your computer's local IP address.

### Running on Android

1. Start an Android emulator or connect a physical device

2. Run the Android application:
   ```bash
   pnpm --filter mobile run android
   ```

### Running on iOS (macOS only)

1. Install iOS dependencies:
   ```bash
   cd apps/mobile/ios
   pod install
   cd ../../..
   ```

2. Run the iOS application:
   ```bash
   pnpm --filter mobile run ios
   ```

## Mobile App Navigation

The mobile app has a similar structure to the web app, with the following screens:

- **Auth Navigator**:
  - Login Screen
  - Signup Screen
  - Forgot Password Screen

- **Registration Navigator**:
  - Basic Profile Screen
  - Dating Preferences Screen
  - Photo Rating Screen
  - AI Coach Chat Screen
  - AI Persona Chat Screen
  - Registration Complete Screen

- **Main Tab Navigator**:
  - Home/Matches Tab
  - Chat Tab
  - Profile Tab

## Troubleshooting

### API Connection Issues

- Ensure the API server is running on port 4001
- Check that your `.env` files have the correct URLs
- For mobile devices, make sure you're using the correct IP address instead of localhost

### Database Issues

- Verify PostgreSQL is running
- Check that your database connection string is correct in the `.env` file
- Ensure migrations have been applied: `pnpm --filter @entwine-rewrite/api run db:migrate`

### Redis Issues

- Verify Redis is running
- Check that your Redis connection string is correct in the `.env` file

### Mobile Build Issues

- For Android, ensure you have the correct SDK installed
- For iOS, ensure you have the latest Xcode version
- Run `pnpm install` to ensure all dependencies are installed correctly

## Additional Resources

- **GraphQL API Documentation**: Available at http://localhost:4001/graphql when the API is running
- **Project Architecture**: See `entwine_rewrite_plan_v6.md` for detailed architecture information
- **Mobile App Interface Plan**: See `entwine_mobile_app_interface_plan.md` for mobile app details
- **Registration Flow Frontend Plan**: See `docs/registration_flow_frontend_plan.md` for registration flow details