// https://github.com/arackaf/customize-cra/blob/master/src/customizers/webpack.js

const AntdScssThemePlugin = require('antd-scss-theme-plugin');

const addLessLoader = (loaderOptions = {}) => config => {
  const mode = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';

  // Need these for production mode, which are copied from react-scripts
  const publicPath = require('react-scripts/config/paths').servedPath;
  const shouldUseRelativeAssetPaths = publicPath === './';
  const shouldUseSourceMap = mode === 'prod' && process.env.GENERATE_SOURCEMAP !== 'false';
  const lessRegex = /\.less$/;
  const lessModuleRegex = /\.module\.less$/;
  const localIdentName = loaderOptions.localIdentName || '[path][name]__[local]--[hash:base64:5]';

  const getLessLoader = cssOptions => {
    return [
      mode === 'dev'
        ? require.resolve('style-loader')
        : {
            loader: require('mini-css-extract-plugin').loader,
            options: Object.assign({}, shouldUseRelativeAssetPaths ? { publicPath: '../../' } : undefined)
          },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          ident: 'postcss',
          plugins: () => [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009'
              },
              stage: 3
            })
          ],
          sourceMap: shouldUseSourceMap
        }
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: process.env.NODE_ENV !== 'production'
        }
      },
      AntdScssThemePlugin.themify({
        loader: 'less-loader',
        options: {
          javascriptEnabled: true,
          sourceMap: process.env.NODE_ENV !== 'production'
        }
      })
    ];
  };

  const loaders = config.module.rules.find(rule => Array.isArray(rule.oneOf)).oneOf;

  // Insert less-loader as the penultimate item of loaders (before file-loader)
  loaders.splice(
    loaders.length - 1,
    0,
    {
      test: lessRegex,
      exclude: lessModuleRegex,
      use: getLessLoader({
        importLoaders: 2
      }),
      sideEffects: mode === 'prod'
    },
    {
      test: lessModuleRegex,
      use: getLessLoader({
        importLoaders: 2,
        modules: true,
        localIdentName: localIdentName
      })
    }
  );

  return config;
};

module.exports = [
  {
    webpack: config => {
      config.resolve.extensions = [...config.resolve.extensions, '.less'];
      config.plugins = [...config.plugins, new AntdScssThemePlugin('./src/theme.scss')];

      config = addLessLoader()(config);

      return config;
    }
  },
  [
    'use-babel-config',
    {
      presets: ['react-app'],
      plugins: [
        [
          'import',
          {
            libraryName: 'antd',
            style: true
          }
        ]
      ]
    }
  ]
];
