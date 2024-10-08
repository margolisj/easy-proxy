import { Config } from './models';

export const loadConfig = (): Config => {
  let config: Config;

  try {
    config = require('../config.json');
  } catch (error) {
    console.log('Unable to find config.json. Please create a new config from the example.');
    process.exit(1);
  }

  var requiredValues = [
    'digital_ocean',
    'linode',
    'auth',
    'provider',
  ];

  for (var i = 0; i < requiredValues.length; i++) {
    if (!config.hasOwnProperty(requiredValues[i])) {
      console.log(`The provided config is invalid: missing: ${requiredValues[i]} Please create a proper config from the example.`);
      process.exit(1);
    }
  }

  return config;
}
