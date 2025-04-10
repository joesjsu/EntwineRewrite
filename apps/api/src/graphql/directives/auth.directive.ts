// apps/api/src/graphql/directives/auth.directive.ts
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import type { GraphQLSchema } from 'graphql';
import { GraphQLError } from 'graphql';
import type { ApiContext } from '@/types/context'; // Adjust path if needed

// Define the directive name
const DIRECTIVE_NAME = 'auth';

// Define the transformer function
export function authDirectiveTransformer(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    // Executes once for each object field definition in the schema
    [MapperKind.OBJECT_FIELD]: (fieldConfig: import('graphql').GraphQLFieldConfig<any, any, any>) => {
      const authDirective = getDirective(schema, fieldConfig, DIRECTIVE_NAME)?.[0];

      if (authDirective) {
        const { resolve } = fieldConfig; // Get the original resolver

        // Replace the original resolver with a function that checks authentication
        fieldConfig.resolve = function (source: any, args: any, context: ApiContext, info: import('graphql').GraphQLResolveInfo) {
          if (!context.user) {
            // Throw an error if the user is not authenticated
            throw new GraphQLError('User is not authenticated', {
              extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 },
              },
            });
          }

          // If authenticated, call the original resolver if it exists
          return resolve ? resolve(source, args, context, info) : fieldConfig;
        };
        return fieldConfig;
      }
      return fieldConfig; // Return unchanged if directive not present
    },
    // You could potentially add MapperKind.OBJECT_TYPE here if you want the directive
    // to apply to all fields of an object, but FIELD_DEFINITION is usually sufficient.
  });
}