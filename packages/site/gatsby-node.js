// eslint-disable-next-line import/no-extraneous-dependencies
const webpack = require('webpack');

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.NormalModuleReplacementPlugin(/node:/u, (resource) => {
        const mod = resource.request.replace(/^node:/u, '');
        switch (mod) {
          case 'crypto':
            resource.request = 'crypto-browserify';
            break;
          default:
            // throw new Error(`Not found ${mod}`);
            break;
        }
      }),
    ],
    resolve: {
      fallback: {
        assert: require.resolve('assert/'),
        crypto: require.resolve('crypto-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        zlib: require.resolve('browserify-zlib'),
      },
    },
  });
};
