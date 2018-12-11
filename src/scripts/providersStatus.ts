import { loadConfig } from '../config';
// import { groupBy } from '../utils';
const config = loadConfig();
const DigitalOcean = require('do-wrapper').default,
    Linode = require('linode-api-node'),
    api = new DigitalOcean(config.digital_ocean.api_key),
    lnc = new Linode(config.linode.apiKey);


const main = async () => {
  let res = await lnc.getLinodeInstances();
  // let linodeKeyed = res.data.map(d => {
  //   let split: Array<string> = d['label'].split('-');
  //   if (split.length > 2) {
  //     d['key'] = split.slice(0, split.length - 2).join('-');
  //   } else {
  //     d['key'] = split[0];
  //   }
  //   return d;
  // });
  // let grouped = groupBy(linodeKeyed, 'key');
  // console.log(grouped);
  // let counted = grouped.map( v => v.length);
  // console.log(counted);

  console.log(`Linode instances: ${res.data.length}`);
  let droplet_response = await api.dropletsGetAll({});
  console.log(`DO instances: ${droplet_response.body.droplets.length}`);
}

main();
