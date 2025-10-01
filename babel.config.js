module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Environment variables
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
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
