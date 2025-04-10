import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  // Schema is loaded directly from the API's .graphql files
  schema: [
    '../api/src/graphql/schema.graphql',
    '../api/src/graphql/directives.graphql',
    '../api/src/graphql/auth.graphql',
    '../api/src/graphql/schemas/**/*.graphql', // Include all schemas in the subdirectory
  ],
  // Documents are the .gql files containing queries/mutations
  documents: ['graphql/**/*.{ts,tsx,gql}'], // Include .ts/.tsx files
  generates: {
    // Output directory for generated files
    'graphql/generated/graphql.ts': { // Output directly to graphql.ts
      // Explicitly list the plugins
      plugins: [
        'typescript', // Generates base TypeScript types
        'typescript-operations', // Generates types for operations (queries/mutations)
        'typescript-react-apollo' // Generates React hooks for Apollo Client
      ],
      config: {
        withHooks: true, // <<< Ensure hooks are generated
        enumsAsTypes: true, // Match API codegen setting
        // Optional: Add scalar mappings if needed
        // scalars: {
        //   DateTime: 'string',
        // },
      },
    },
    // Removed the separate gql.ts generation block
  },
  ignoreNoDocuments: true, // Don't error if no .gql files are found initially
};

export default config;