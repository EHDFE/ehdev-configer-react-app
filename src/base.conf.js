/**
 * Base Config
 * 1. introduce eslint
 */
const path = require('path');
const SHELL_NODE_MODULES_PATH = process.env.SHELL_NODE_MODULES_PATH;
const CONFIGER_FOLDER_PATH = process.env.CONFIGER_FOLDER_PATH;
const webpack = require(path.join(SHELL_NODE_MODULES_PATH, 'webpack'));

const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const { PROJECT_ROOT, SOURCE_DIR } = require('./utils');

module.exports = async (PROJECT_CONFIG, options) => {
  const alias = {};
  Object.keys(PROJECT_CONFIG.alias).forEach(name => {
    Object.assign(alias, {
      [name]: path.resolve(SOURCE_DIR, PROJECT_CONFIG.alias[name]),
    })
  });
  return {
    entry: {},
    output: {},
    resolve: {
      extensions: [
        // '.web.ts',
        '.ts',
        // '.web.tsx',
        '.tsx',
        // '.wasm',
        '.mjs',
        // '.web.js',
        '.js',
        '.json',
        // '.web.jsx',
        '.jsx',
      ],
      modules: [
        'node_modules',
        path.join(CONFIGER_FOLDER_PATH, 'node_modules'),
        path.resolve(__dirname, '../node_modules'),
      ],
      alias,
    },
    module: {
      strictExportPresence: true,
    },
    externals: {},
    target: 'web',
    plugins: [
      new CaseSensitivePathsPlugin(),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how Webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      // Generate a manifest file which contains a mapping of all asset filenames
      // to their corresponding output file so that tools can pick it up without
      // having to parse `index.html`.
      new ManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: PROJECT_CONFIG.publicPath,
      }),
    ],
    node: {
      dgram: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty',
    },
  };
};
