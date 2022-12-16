// Helper for combining webpack config objects
const { merge } = require('webpack-merge');

module.exports = (config, context) => {
  return merge(config, {
    module: {
      rules: [
        {
          test: /\.(png|svg|jpg|jpeg|gif|ogg|mp3|wav)$/i,
          type: 'asset/resource',
        },
      ],
    },
  });

};