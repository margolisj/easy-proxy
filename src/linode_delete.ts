export {};

const Linode = require('linode-api-node');
const config = require('./config');

const lnc = new Linode(config.linode.apiKey);

let deleteInstances = async () => {
    try {
      // Delete droplets
      let res = await lnc.getLinodeInstances();
      let nodes = res.data;
      let deletePromises = nodes.map(async (node) => await lnc.removeLinodeInstances(node.id));
      let results = await Promise.all(deletePromises);
      console.log(results);
    } catch (err) {
      console.log(err);
    }
};

deleteInstances();
