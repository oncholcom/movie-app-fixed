const path = require('path');

module.exports = function(api) {
  api.cache(true);
  const envPath = path.resolve(__dirname, '.env');
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Environment variables
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: envPath,
        safe: false,
        allowUndefined: true,
      }],
    ],
    env: {
      production: {
        plugins: [
          // Remove console logs in production
          ['transform-remove-console', { 
            exclude: ['error', 'warn'] 
          }],
        ],
      },
    },
  };
};
