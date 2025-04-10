// Export all schema definitions and relations
export * from './schema';

// Re-export commonly used Drizzle functions to ensure consistent types
export { eq, sql } from 'drizzle-orm';

// Export validation schemas (add later)
// export * from "./validation";

// Export constants (add later)
// export * from "./constants";

// Example Zod schema (can be removed or moved to validation file later)
import { z } from "zod";

export const ExampleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

export type ExampleType = z.infer<typeof ExampleSchema>;