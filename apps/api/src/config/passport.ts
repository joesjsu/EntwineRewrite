import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { db, users } from '../db'; // Import db and users table
import { eq } from '@entwine-rewrite/shared'; // Import eq from shared package
import { logger } from './logger'; // Import structured logger
 
// Load JWT secret from environment variables (ensure this is set!)
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'insecure-default-access-secret';

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_ACCESS_SECRET,
  // issuer: 'accounts.example.com', // Optional: Add issuer if needed
  // audience: 'yoursite.net', // Optional: Add audience if needed
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      // jwtPayload.sub contains the user ID we stored during token generation
      if (!jwtPayload.sub) {
        return done(null, false); // No user ID in token
      }

      const userId = parseInt(jwtPayload.sub, 10);
      if (isNaN(userId)) {
        return done(null, false); // Invalid user ID format
      }

      // Find the user in the database based on the ID from the token
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        // Optionally select only necessary fields
        // columns: { id: true, phoneNumber: true, role: true }
      });

      if (user) {
        // If user found, attach user object to the request (or just ID/subset)
        return done(null, user);
      } else {
        // If user not found (e.g., deleted after token issued)
        return done(null, false);
      }
    } catch (error) {
      logger.error('Error in JWT strategy:', error); // Pass the full error object
      return done(error, false);
    }
  })
);

// Note: We are using JWT, so serializeUser/deserializeUser are typically not needed
// as we are not storing user info in a session.

export default passport;