import { loadConfig } from '../config';
import * as Linode from 'linode-api-node';

const config = loadConfig();
const lnc = new Linode(config.linode.apiKey);

const main = async () => {
  try {
    // Delete droplets with label
    console.log(`Deleting droplets with label: ${config.linode.label}`)
    let res = await lnc.getLinodeInstances();
    let nodes = res.data.filter(node => node.label.includes(config.linode.label));
    let deletePromises = nodes.map(async (node) => await lnc.removeLinodeInstances(node.id));
    let results = await Promise.all(deletePromises);
    console.log(`Succesfully deleted ${results.length} instances`);
  } catch (err) {
    console.log(err);
  }
};

main();
