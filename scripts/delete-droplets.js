let config = require('../config');
let DigitalOcean = require('do-wrapper'),
    api = new DigitalOcean(config.digital_ocean.api_key, '9999');
/*
  WARNING: This will delete all of your digital ocean droplets. ALL OF THEM.
  Well, really just the ones with the tag provided below.
*/

let tag = 'prox';

let getAllDroplets = () => {
  return new Promise((resolve, reject) => {
    api.dropletsGetAll({}, (err, resp, body) => {
      if (err) {
        reject(err);
      }
      resolve(body);
    });
  });
};

let deleteDroplets = (dropletId) => {
  console.log(`Deleting droplet with ID ${dropletId}`)
  return new Promise((resolve, reject) => {
    api.dropletsDelete(dropletId, (err, resp, body) => {
      if (err) {
        reject(err);
      }
      resolve(resp.statusCode == 204);
    });
  });
}

let main = async () => {
  try {
    let droplet_response = await getAllDroplets();
    let droplets_deletes = droplet_response
      .droplets
      .filter(d => d.tags.includes('prox'))
      .map(d => deleteDroplets(d.id));
    let delete_responses = await Promise.all(droplets_deletes);
    console.log(delete_responses);
  } catch (err) {
    console.log(err);
  }

};

main();
