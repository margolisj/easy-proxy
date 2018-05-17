import { loadConfig } from '../config';
const config = loadConfig();
const DigitalOcean = require('do-wrapper'),
    Linode = require('linode-api-node'),
    api = new DigitalOcean(config.digital_ocean.api_key, '9999'),
    lnc = new Linode(config.linode.apiKey);


const main = async () => {
  let res = await lnc.getLinodeInstances();
  console.log(`Linode instances: ${res.data.length}`);
  let droplet_response = await api.dropletsGetAll({});
  console.log(`DO instances: ${droplet_response.body.droplets.length}`);
}

main();
