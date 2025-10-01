const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  // Hermes bytecode support
  hermesCommand: '../../node_modules/react-native/sdks/hermetic/bin/hermesc',
  
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    ecma: 2015,
    keep_classnames: false,
    keep_fnames: false,
    module: true,
    mangle: {
      module: true,
      keep_classnames: false,
      keep_fnames: false,
      toplevel: true,
      eval: true,
    },
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: [
        'console.log',
        'console.info',
        'console.debug',
        'console.warn',
        'console.trace',
      ],
      passes: 3,
      dead_code: true,
      global_defs: {
        __DEV__: false,
      },
    },
    output: {
      comments: false,
      ascii_only: true,
    },
  },
};

module.exports = config;
