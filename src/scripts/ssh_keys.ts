export {};

const config = require('../config');
const DigitalOcean = require('do-wrapper'),
    api = new DigitalOcean(config.digital_ocean.api_key, '9999');

api.accountGetKeys({}, function(err, resp, body) {
  if (err) {
    console.log(err)
  }
  console.log(body)
});
