import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm'; // Import eq
import { Pool } from 'pg';
import * as schema from '@entwine-rewrite/shared'; // Import all schema objects
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt'; // For hashing passwords

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const BCRYPT_SALT_ROUNDS = 10; // Consistent salt rounds

async function main() {
  console.log('🌱 Starting database seeding...');

  const connectionString = process.env.DATABASE_URL_DEV; // Use the dev database URL
  if (!connectionString) {
    console.error('❌ DATABASE_URL_DEV environment variable is not set.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  try {
    // --- Seeding Logic Start ---

    console.log('Clearing existing data (optional)...');
    // Example: await db.delete(schema.users); // Be careful with this in production!
    // Consider clearing related tables too if uncommenting user deletion
    // await db.delete(schema.datingPreferences);
    // await db.delete(schema.userPhotos);
    // await db.delete(schema.userInterests);
    // await db.delete(schema.userValues);

    console.log('Seeding users and related data...');
    const usersToSeed = 15; // Increase user count for better testing data
    const seededUsers = [];

    for (let i = 0; i < usersToSeed; i++) {
      const birthday = faker.date.birthdate({ min: 18, max: 65, mode: 'age' });
      const userAge = new Date().getFullYear() - birthday.getFullYear();
      const hashedPassword = await bcrypt.hash('password123', BCRYPT_SALT_ROUNDS); // Use a default password

      const newUser = {
        // id: uuidv4(), // Drizzle handles default UUID generation if configured
        firstName: faker.person.firstName(), // Use firstName
        lastName: faker.person.lastName(),   // Use lastName
        // email: faker.internet.email().toLowerCase(), // Email field removed as it's not in the users schema
        phoneNumber: faker.phone.number().slice(0, 20), // Generate and truncate to max 20 chars
        hashedPassword: hashedPassword,
        registrationStep: 6, // Assume completed registration for seeded users
        profileComplete: true,
        bio: faker.lorem.paragraph(),
        birthday: birthday,
        // location: // Needs proper handling (e.g., PostGIS point or structured JSON)
        gender: faker.helpers.arrayElement(['male', 'female', 'other']),
        // Ensure all required fields from the 'users' table are included
      };

      // Insert User
      const insertedUserArray = await db.insert(schema.users).values(newUser).returning();
      const insertedUser = insertedUserArray[0];
      if (!insertedUser) {
          console.error(`❌ Failed to insert user with phone: ${newUser.phoneNumber}`);
          continue; // Skip to next user if insertion failed
      }
      seededUsers.push(insertedUser);
      console.log(`👤 Seeded user with phone: ${insertedUser.phoneNumber} (ID: ${insertedUser.id})`);

      // Seed Dating Preferences
      const minPrefAge = faker.number.int({ min: 18, max: Math.max(18, userAge - 2) }); // Ensure minPrefAge <= userAge
      const maxPrefAge = faker.number.int({ min: Math.min(65, userAge + 2), max: 65 }); // Ensure maxPrefAge >= userAge
      const newDatingPrefs = {
          userId: insertedUser.id,
          genderPreference: faker.helpers.arrayElement(['male', 'female', 'other', 'any']),
          minAge: minPrefAge,
          maxAge: maxPrefAge,
          maxDistance: faker.number.int({ min: 5, max: 150 }), // e.g., 5 to 150 miles/km
      };
      await db.insert(schema.datingPreferences).values(newDatingPrefs);
      console.log(`   L Seeded dating preferences for user ID: ${insertedUser.id}`);

      // Seed User Photos (3-5 photos per user)
      const photosToSeed = faker.number.int({ min: 3, max: 5 });
      for (let p = 0; p < photosToSeed; p++) {
          const newPhoto = {
              userId: insertedUser.id,
              url: faker.image.urlLoremFlickr({ category: 'people', width: 640, height: 480 }) + `?random=${Date.now()}${p}`, // Add random query param for uniqueness
              order: p,
              isPrimary: p === 0, // First photo is primary
          };
          await db.insert(schema.userPhotos).values(newPhoto);
      }
      console.log(`   L Seeded ${photosToSeed} photos for user ID: ${insertedUser.id}`);

      // Seed User Interests
      const interestsCount = faker.number.int({ min: 3, max: 8 });
      const interests = Array.from({ length: interestsCount }, () => ({
          name: faker.word.noun(), // Use noun for more typical interests
          source: faker.helpers.arrayElement(['user', 'ai']), // Mix sources
          confidence: faker.helpers.maybe(() => faker.number.float({ min: 0.5, max: 1.0, fractionDigits: 2 }), { probability: 0.7 }) // Optional confidence for AI source
      }));
      const newUserInterests = {
          userId: insertedUser.id,
          interests: interests,
      };
      await db.insert(schema.userInterests).values(newUserInterests);
      console.log(`   L Seeded ${interestsCount} interests for user ID: ${insertedUser.id}`);


      // Seed User Values
      const valuesCount = faker.number.int({ min: 4, max: 7 });
      const values = Array.from({ length: valuesCount }, () => ({
          name: faker.word.adjective(), // Use adjective for values
          source: faker.helpers.arrayElement(['registration', 'user']), // Mix sources
          highlighted: faker.datatype.boolean(0.3) // Occasionally highlight a value
      }));
       const newUserValues = {
          userId: insertedUser.id,
          values: values,
      };
      await db.insert(schema.userValues).values(newUserValues);
      console.log(`   L Seeded ${valuesCount} values for user ID: ${insertedUser.id}`);

    }

    console.log('👤 Seeding dedicated admin user...');
    const adminPassword = 'adminpass'; // Choose a secure password in a real scenario
    const hashedAdminPassword = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);
    const adminPhoneNumber = '+10000000001'; // Use a distinct phone number

    try {
      const adminUser = {
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: adminPhoneNumber,
        hashedPassword: hashedAdminPassword,
        registrationStep: 6, // Completed registration
        profileComplete: true,
        bio: 'System Administrator Account',
        birthday: new Date(1990, 0, 1), // Example birthday
        gender: 'other',
        role: 'ADMIN' as 'ADMIN', // Explicitly cast to satisfy TS/Drizzle enum type
      };

      const insertedAdminArray = await db.insert(schema.users).values(adminUser).returning();
      const insertedAdmin = insertedAdminArray[0];

      if (insertedAdmin) {
        console.log(`🔑 Seeded ADMIN user with phone: ${insertedAdmin.phoneNumber} (ID: ${insertedAdmin.id})`);
        // Optionally seed related data for the admin if needed (prefs, photos etc.)
        // For simplicity, skipping related data seeding for admin here.
      } else {
         console.warn(`⚠️ Admin user with phone ${adminPhoneNumber} might already exist or failed to insert.`);
         // Check if admin already exists
         const existingAdmin = await db.select().from(schema.users).where(eq(schema.users.phoneNumber, adminPhoneNumber)).limit(1);
         if (existingAdmin.length > 0) {
            console.log(`   -> Admin user with phone ${adminPhoneNumber} already exists. Skipping insertion.`);
         } else {
            console.error(`❌ Failed to insert admin user with phone: ${adminPhoneNumber}`);
         }
      }
    } catch (error: any) {
        // Handle potential unique constraint violation if admin already exists
        if (error.code === '23505') { // PostgreSQL unique violation error code
             console.warn(`⚠️ Admin user with phone ${adminPhoneNumber} likely already exists (unique constraint violation).`);
        } else {
            console.error('❌ Error seeding admin user:', error);
        }
    }


    // --- Add more seeding logic here (dealbreakers, improvement areas, etc.) ---

    console.log('✅ Seeding completed successfully!');

    // --- Seeding Logic End ---
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    console.log('Closing database connection...');
    await pool.end(); // Ensure the connection pool is closed
    console.log('Database connection closed.');
  }
}

main().catch((error) => {
  console.error('❌ Unhandled error in main seeding function:', error);
  process.exit(1);
});