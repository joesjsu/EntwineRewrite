// apps/api/codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';
// Removed @graphql-tools/load and path imports

const config: CodegenConfig = {
  overwrite: true,
  // Temporarily exclude directives.graphql for diagnostics
  schema: [
    "src/graphql/schema.graphql", // Base Query/Mutation
    "src/graphql/directives.graphql", // Directive definitions
    "src/graphql/auth.graphql", // Auth types/mutations
    "src/graphql/schemas/**/*.graphql" // Other schema files
  ],
  // Define where the generated output file will be placed
  generates: {
    "src/graphql/generated/graphql.ts": {
      // Use the typescript and typescript-resolvers plugins
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        // Map the custom context type defined earlier
        contextType: './src/types/context#ApiContext',
        // Use mapped types for enums (maps GraphQL enums to TS string literals)
        enumsAsTypes: true,
        // Optional: Add other configurations like scalar mapping if needed
        scalars: {
          // DateTime: 'Date', // Keep DateTime commented if not used/defined
          Json: '{ [key: string]: any }', // Map the JSON scalar
        },
        // Ensure generated resolvers correctly use the context type
        useIndexSignature: true, // Helps with resolver signatures
        // Avoid defaultMapper for cleaner resolver types if not needed
        // defaultMapper: 'Partial<{T}>',
      },
    },
  },
  // Optional: Ignore specific files if needed
  // ignoreNoDocuments: true,
};

export default config;