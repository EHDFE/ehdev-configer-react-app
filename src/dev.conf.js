/**
 * development config
 */
const path = require('path');
const SHELL_NODE_MODULES_PATH = process.env.SHELL_NODE_MODULES_PATH;
const webpack = require(path.join(SHELL_NODE_MODULES_PATH, 'webpack'));
const HtmlWebpackPlugin = require(path.join(SHELL_NODE_MODULES_PATH, 'html-webpack-plugin'));
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const lessLoader = require.resolve('less-loader');

const {
  PROJECT_ROOT,
  SOURCE_DIR,
  TSCONFIG_PATH,
  // TSLINT_PATH,
  getStyleLoaders,
  cssRegex,
  cssModuleRegex,
  lessRegex,
  lessModuleRegex,
  getBabelLoaderConfig,
} = require('./utils');

const PUBLIC_PATH = '/';
const ENV = 'DEVELOPMENT';

const workerPool = {
  poolTimeout: Infinity,
};

module.exports = async (PROJECT_CONFIG, options) => {
  const BUILD_PATH = path.join(PROJECT_ROOT, PROJECT_CONFIG.buildPath);
  
  const configResult = {};
  
  const devServerEntry = [
    `${require.resolve(`${path.join(SHELL_NODE_MODULES_PATH, 'webpack-dev-server')}/client`)}?http://${options.ip ? options.ip : 'localhost'}:${options.port}`,
    require.resolve(`${path.join(SHELL_NODE_MODULES_PATH, 'webpack')}/hot/dev-server`),
  ];

  // entry config
  const entry = {};
  // plugins config
  const plugins = [];
  
  Object.keys(PROJECT_CONFIG.entry).forEach(entryName => {
    const scripts = [
      ...devServerEntry,
      path.join(SOURCE_DIR, `${entryName}.tsx`),
    ];
    Object.assign(entry, {
      [entryName]: scripts,
    });
    plugins.push(
      new HtmlWebpackPlugin(Object.assign({
        filename: PROJECT_CONFIG.entry[entryName],
        template: path.join(SOURCE_DIR, PROJECT_CONFIG.entry[entryName]),
        // chunks: [
        //   entryName,
        // ],
      }, PROJECT_CONFIG.htmlWebpackPlugin))
    );
  })

  // output config
  const output = {
    path: BUILD_PATH,
    // Add /* filename */ comments to generated require()s in the output.
    pathinfo: true,
    publicPath: PUBLIC_PATH,
  };

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
              name: '[name].[hash:8].[ext]',
            },
          },
          // Process JS with Babel.
          {
            test: /\.(ts|tsx|js|jsx|mjs)$/,
            include: SOURCE_DIR,
            exclude: [/[/\\\\]node_modules[/\\\\]/],
            use: [
              { loader: require.resolve('cache-loader') },
              // This loader parallelizes code compilation, it is optional but
              // improves compile time on larger projects
              {
                loader: require.resolve('thread-loader'),
                options: workerPool,
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
              localIdentName: '[name]__[local]',
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
                localIdentName: '[name]__[local]',
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
          // "file" loader makes sure those assets get served by WebpackDevServer.
          // When you `import` an asset, you get its (virtual) filename.
          // In production, they would get copied to the `build` folder.
          // This loader doesn't use a "test" so it will catch all modules
          // that fall through the other loaders.
          {
            // Exclude `js` files to keep "css" loader working as it injects
            // its runtime that would otherwise be processed through "file" loader.
            // Also exclude `html` and `json` extensions so they get processed
            // by webpacks internal loaders.
            exclude: [/\.(ts|tsx|js|jsx|mjs)$/, /\.html$/, /\.json$/],
            loader: require.resolve('file-loader'),
            options: {
              name: '[name].[hash:8].[ext]',
            },
          },
        ],
      }
    ]
  };

  plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    // Add module names to factory functions so they appear in browser profiler.
    new webpack.NamedModulesPlugin(),
    new webpack.WatchIgnorePlugin([
      /\.d\.ts$/,
    ]),
  );

  if (PROJECT_CONFIG.enableTsCheckerPlugin) {
    plugins.push(
      new ForkTsCheckerWebpackPlugin({
        tsconfig: TSCONFIG_PATH,
        tslint: false,
        checkSyntacticErrors: true,
        watch: SOURCE_DIR,
        async: true,
      }),
    )
  }

  Object.assign(configResult, {
    entry,
    output,
    module,
    plugins,
    // devtool: 'cheap-module-source-map',
    devtool: 'inline-source-map',
    optimization: {
      // enable long term caching
      runtimeChunk: true,
      // Automatically split vendor and commons
      splitChunks: {
        chunks: 'all',
        name: 'vendors',
        cacheGroups: {
          style: {
            name: 'style',
            test: /\.(le|c)ss$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    },
    // Turn off performance hints during development because we don't do any
    // splitting or minification in interest of speed. These warnings become
    // cumbersome.
    performance: {
      hints: 'warning',
    },
  });

  return configResult;
};