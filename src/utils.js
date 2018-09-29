const path = require('path');
// const SHELL_NODE_MODULES_PATH = process.env.SHELL_NODE_MODULES_PATH;
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const PROJECT_ROOT = exports.PROJECT_ROOT = process.cwd();


exports.SOURCE_DIR = path.join(PROJECT_ROOT, 'src');
exports.TSCONFIG_PATH = path.join(PROJECT_ROOT, 'tsconfig.json');
exports.TSLINT_PATH = path.join(PROJECT_ROOT, 'tslint.json');

// common function to get style loaders
exports.getStyleLoaders = (env, cssOptions, preProcessor) => {
  const loaders = [
    env === 'PRODUCTION' ?
      MiniCssExtractPlugin.loader : require.resolve('style-loader'),
    {
      loader: cssOptions.modules ? require.resolve('typings-for-css-modules-loader') : require.resolve('css-loader'),
      options: cssOptions,
    },
    {
      // Options for PostCSS as we reference these options twice
      // Adds vendor prefixing based on your specified browser support in
      // package.json
      loader: require.resolve('postcss-loader'),
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebook/create-react-app/issues/2677
        ident: 'postcss',
        plugins: () => [
          require('postcss-flexbugs-fixes'),
          autoprefixer({
            flexbox: 'no-2009',
          }),
        ],
      },
    },
  ];
  if (preProcessor) {
    loaders.push(preProcessor);
  }
  return loaders;
};

exports.cssRegex = /\.css$/;
exports.cssModuleRegex = /\.module\.css$/;
exports.lessRegex = /\.(scss|less)$/;
exports.lessModuleRegex = /\.module\.(scss|less)$/;

exports.getBabelLoaderConfig = (env, PROJECT_CONFIG) => {
  return {
    loader: require.resolve('babel-loader'),
    options: {
      // @remove-on-eject-begin
      babelrc: false,
      // @remove-on-eject-end
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            targets: {
              browsers: PROJECT_CONFIG.browserSupports[env],
            }, 
            modules: false,
            useBuiltIns: PROJECT_CONFIG.babelUseBuiltIns,
          }
        ],
        require.resolve('@babel/preset-typescript'),
        require.resolve('@babel/preset-react'),
      ],
      plugins: [
        require.resolve('@babel/plugin-syntax-dynamic-import'),
        [ require.resolve('@babel/plugin-proposal-decorators'), { legacy: true } ],
        [ require.resolve('@babel/plugin-proposal-class-properties'), { loose: true } ],
      ].concat(
        env === 'DEVELOPMENT' ? [
          require.resolve('react-hot-loader/babel')
        ] : []
      ),
      // This is a feature of `babel-loader` for webpack (not Babel itself).
      // It enables caching results in ./node_modules/.cache/babel-loader/
      // directory for faster rebuilds.
      cacheDirectory: true,
      compact: true,
      highlightCode: true,
    },
  };
};
