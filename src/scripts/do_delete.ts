import { loadConfig } from '../config';
const config = loadConfig();
const DigitalOcean = require('do-wrapper').default,
      api = new DigitalOcean(config.digital_ocean.api_key);


const main = async () => {

  try {
    console.log(`Deleting droplets with label: ${config.digital_ocean.tag}`);

    const dropletResponse = await api.dropletsGetAll({});
    const dropletsDeletes = dropletResponse.body.droplets
      .filter(d => d.tags.includes(config.digital_ocean.tag))
      .map(async (droplet) => {
        let resp = await api.dropletsDelete(droplet.id);
        return resp.response.statusCode === 204;
      });
    const deleteResponses = await Promise.all(dropletsDeletes);
    console.log(`Successfully deleted ${deleteResponses.length} instances`);
  } catch (err) {
    console.log(err);
  }

};

main();
