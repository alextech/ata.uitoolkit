module.exports = {
  "stories": [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  webpackFinal: async(config, { configType }) => {
    config.module.rules.push(
        {
          test: /\.scss$/,
          use: ['constructable-style-loader', 'postcss-loader', 'sass-loader']
        }
    );

    return config;
  }
}