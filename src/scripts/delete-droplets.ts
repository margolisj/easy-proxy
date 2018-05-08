import { loadConfig } from '../config';
const config = loadConfig();
let DigitalOcean = require('do-wrapper'),
    api = new DigitalOcean(config.digital_ocean.api_key, '9999');

let tag = 'easy';

let main = async () => {
  try {
    let droplet_response = await api.dropletsGetAll({});
    let droplets_deletes = droplet_response.body.droplets
      .filter(d => d.tags.includes(tag))
      .map(async (droplet) => {
        let resp = await api.dropletsDelete(droplet.id);
        return resp.response.statusCode === 204;
      });
    let delete_responses = await Promise.all(droplets_deletes);
    console.log(delete_responses);
  } catch (err) {
    console.log(err);
  }

};

main();
