import { loadConfig } from '../config';
const config = loadConfig();
const DigitalOcean = require('do-wrapper').default,
      api = new DigitalOcean(config.digital_ocean.api_key, '9999');


api.regionsGetAll({}, function(err, resp, body) {
  if (err) {
    console.log(err)
  }
  console.log(JSON.stringify(body, null, 4));
});
