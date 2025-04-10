// jest.resolver.cjs
// Custom resolver for Jest ESM support, especially with ts-jest and path mapping.
// See: https://jestjs.io/docs/ecmascript-modules#module-path-mapping

const path = require('path');

module.exports = (request, options) => {
  // Call the defaultResolver, so we leverage its cache, error handling, etc.
  return options.defaultResolver(request, {
    ...options,
    // Use packageFilter to process parsed `package.json` before the resolution (see note below)
    packageFilter: (pkg) => {
      // Jest-resolve appears to be incorrectly default resolving browser-specific fields
      // instead of node-specific fields in some circumstances for some libraries.
      // Specifically, when using node >= 18 targeting esnext modules.
      // This overrides the default behaviour specifically for @google/generative-ai
      // See: https://github.com/firebase/firebase-admin-node/issues/1488
      // And: https://github.com/microsoft/accessibility-insights-web/pull/5421/commits/9ad4e618019298d82732d49d00aafb846fb6bac9
      // Adjust this if other packages cause similar issues.
      if (pkg.name === '@google/generative-ai') {
        // console.log(`Applying packageFilter for ${pkg.name}`);
        delete pkg['exports'];
        delete pkg['module'];
      }
      return pkg;
    },
    // Use 'conditions' to ensure Node-specific exports are preferred.
    // Add 'import' and 'require' if needed, depending on your project's needs.
    conditions: ['node', 'node-addons'],
  });
};