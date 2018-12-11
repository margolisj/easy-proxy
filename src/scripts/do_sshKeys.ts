import { loadConfig } from '../config';
const config = loadConfig();
const DigitalOcean = require('do-wrapper'),
    api = new DigitalOcean(config.digital_ocean.api_key, '9999');


api.accountGetKeys({}, (err, resp, body) => {
  if (err) {
    console.log(err);
  }
  console.log(body);
});
