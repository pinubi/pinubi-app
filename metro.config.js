const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Disable Hermes for debugging
config.transformer.hermesCommand = '';
config.transformer.enableHermes = false;

module.exports = withNativeWind(config, { input: './src/global.css' });
