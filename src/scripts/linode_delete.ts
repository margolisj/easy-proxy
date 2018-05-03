const Linode = require('linode-api-node');
import { loadConfig } from '../config';
const config = loadConfig();

const lnc = new Linode(config.linode.apiKey);

let deleteInstances = async () => {
    try {
      // Delete droplets
      let res = await lnc.getLinodeInstances();
      let nodes = res.data;
      let deletePromises = nodes.map(async (node) => await lnc.removeLinodeInstances(node.id));
      let results = await Promise.all(deletePromises);
      console.log(results);
      console.log('Completed');

    } catch (err) {
      console.log(err);
    }
};

deleteInstances();
