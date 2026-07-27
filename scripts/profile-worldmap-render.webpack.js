const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: path.resolve(__dirname, 'profile-worldmap-render.ts'),
  output: {
    path: path.resolve(__dirname, '.profile-build'),
    filename: 'profile-worldmap-render.cjs',
  },
  resolve: { extensions: ['.ts', '.js'] },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: [{ loader: 'ts-loader', options: { transpileOnly: true } }],
    }],
  },
  plugins: [
    new webpack.DefinePlugin({
      acquireVsCodeApi: '(() => ({ postMessage() {}, getState() { return {}; }, setState() {} }))',
      EXTENSION_ID: JSON.stringify('hoi4modernutils-profile'),
      VERSION: JSON.stringify('profile'),
      window: '({ addEventListener() {}, removeEventListener() {}, __stateBoundaryColor: "rgba(0,0,0,0.4)", __stateBoundaryWidth: 1.5 })',
    }),
  ],
  optimization: { minimize: false },
};
