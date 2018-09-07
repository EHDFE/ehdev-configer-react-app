/**
 * production config
 */
const path = require('path');
const SHELL_NODE_MODULES_PATH = process.env.SHELL_NODE_MODULES_PATH;
const webpack = require(path.join(SHELL_NODE_MODULES_PATH, 'webpack'));
const HtmlWebpackPlugin = require(path.join(SHELL_NODE_MODULES_PATH, 'html-webpack-plugin'));
const UglifyJsPlugin = require(path.join(SHELL_NODE_MODULES_PATH, 'uglifyjs-webpack-plugin'));
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require(path.join(SHELL_NODE_MODULES_PATH, 'clean-webpack-plugin'));
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const lessLoader = require.resolve('less-loader');

const {
  PROJECT_ROOT,
  SOURCE_DIR,
  TSCONFIG_PATH,
  getStyleLoaders,
  cssRegex,
  cssModuleRegex,
  lessRegex,
  lessModuleRegex,
  getBabelLoaderConfig,
} = require('./utils');

const PUBLIC_PATH = '/';
const ENV = 'PRODUCTION';

module.exports = async (PROJECT_CONFIG, options) => {
  const BUILD_PATH = path.join(PROJECT_ROOT, PROJECT_CONFIG.buildPath);
  
  const configResult = {};

  // output config
  const output = {
    path: BUILD_PATH,
     // Generated JS file names (with nested folders).
    // There will be one main bundle, and one file per asynchronous chunk.
    // We don't currently advertise code splitting but Webpack supports it.
    filename: 'static/js/[name].[chunkhash:8].js',
    chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
    publicPath: PROJECT_CONFIG.publicPath || PUBLIC_PATH,
  };

  // entry config
  const entry = {};
  // plugins config
  const plugins = [];

  Object.keys(PROJECT_CONFIG.entry).forEach(entryName => {
    Object.assign(entry, {
      [entryName]: path.join(SOURCE_DIR, `${entryName}.tsx`),
    });
    plugins.push(
      new HtmlWebpackPlugin(Object.assign({
        filename: PROJECT_CONFIG.entry[entryName],
        template: path.join(SOURCE_DIR, PROJECT_CONFIG.entry[entryName]),
        // chunks: [
        //   entryName,
        // ],
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: false,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }, PROJECT_CONFIG.htmlWebpackPlugin))
    );
  })

  // module config
  const module = {
    rules: [
      // Disable require.ensure as it's not a standard language feature.
      { parser: { requireEnsure: false } },

      {
        // "oneOf" will traverse all following loaders until one will
        // match the requirements. When no loader matches it will fall
        // back to the "file" loader at the end of the loader list.
        oneOf: [
          // "url" loader works like "file" loader except that it embeds assets
          // smaller than specified limit in bytes as data URLs to avoid requests.
          // A missing `test` is equivalent to a match.
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.webp$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
          // Process JS with Babel.
          {
            test: /\.(ts|tsx|js|jsx|mjs)$/,
            include: SOURCE_DIR,
            exclude: [/[/\\\\]node_modules[/\\\\]/],
            use: [
              // This loader parallelizes code compilation, it is optional but
              // improves compile time on larger projects
              {
                loader: require.resolve('thread-loader'),
                options: {
                  poolTimeout: Infinity // keep workers alive for more effective watch mode
                },
              },
              getBabelLoaderConfig(ENV, PROJECT_CONFIG),
            ],
          },
          // "postcss" loader applies autoprefixer to our CSS.
          // "css" loader resolves paths in CSS and adds assets as dependencies.
          // "style" loader turns CSS into JS modules that inject <style> tags.
          // In production, we use a plugin to extract that CSS to a file, but
          // in development "style" loader enables hot editing of CSS.
          // By default we support CSS Modules with the extension .module.css
          {
            test: cssRegex,
            exclude: cssModuleRegex,
            use: getStyleLoaders(ENV, {
              importLoaders: 1,
            }),
          },
          // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
          // using the extension .module.css
          {
            test: cssModuleRegex,
            use: getStyleLoaders(ENV, {
              importLoaders: 1,
              modules: true,
              localIdentName: '[hash:base64:5]',
              namedExport: true,
            }),
          },
          // Opt-in support for Less (using .less extension).
          // Chains the less-loader with the css-loader and the style-loader
          // to immediately apply all styles to the DOM.
          // By default we support LESS Modules with the
          // extension .module.less
          {
            test: lessRegex,
            exclude: lessModuleRegex,
            use: getStyleLoaders(
              ENV,
              { importLoaders: 2 },
              {
                loader: lessLoader,
                options: {
                  javascriptEnabled: true,
                },
              },
            ),
          },
          // Adds support for CSS Modules, but using SASS
          // using the extension .module.scss or .module.sass
          {
            test: lessModuleRegex,
            use: getStyleLoaders(
              ENV,
              {
                importLoaders: 2,
                modules: true,
                localIdentName: '[hash:base64:5]',
                namedExport: true,
              },
              {
                loader: lessLoader,
                options: {
                  javascriptEnabled: true,
                },
              },
            ),
          },
          // "file" loader makes sure assets end up in the `build` folder.
          // When you `import` an asset, you get its filename.
          // This loader doesn't use a "test" so it will catch all modules
          // that fall through the other loaders.
          {
            exclude: [/\.(ts|tsx|js|jsx|mjs)$/, /\.html$/, /\.json$/],
            loader: require.resolve('file-loader'),
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
      }
    ],
  };

  plugins.push(
    new CleanWebpackPlugin([
      PROJECT_CONFIG.buildPath,
    ], {
      root: PROJECT_ROOT,
      verbose: true,
      dry: false,
    }),
    new webpack.HashedModuleIdsPlugin(),
    new ForkTsCheckerWebpackPlugin({
      tsconfig: TSCONFIG_PATH,
      tslint: false,
      checkSyntacticErrors: true,
      watch: SOURCE_DIR,
      async: true,
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),
  );

  Object.assign(configResult, {
    // Don't attempt to continue if there are any errors.
    bail: true,
    entry,
    output,
    module,
    plugins,
    devtool: 'source-map',
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          uglifyOptions: {
            parse: {
              // we want uglify-js to parse ecma 8 code. However, we don't want it
              // to apply any minfication steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true,
            },
          },
          cache: true,
          sourceMap: true,
          parallel: true,
        }),
        new OptimizeCssAssetsPlugin({
          cssProcessorOptions: {
          },
        }),
      ],
      // Automatically split vendor and commons
      // https://twitter.com/wSokra/status/969633336732905474
      // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
      splitChunks: {
        chunks: 'all',
        name: 'vendors',
      },
      // Keep the runtime chunk seperated to enable long term caching
      // https://twitter.com/wSokra/status/969679223278505985
      runtimeChunk: true,
    },
  });

  return configResult;
};