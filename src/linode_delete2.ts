export {};

const Linode = require('linode-api-node');
import { loadConfig } from './config';
const config = loadConfig();

const lnc = new Linode(config.linode.apiKey);

let main = async () => {

  let nodes = await lnc.getLinodeInstances();
  let ids = nodes.data.map(n => n.id);
  console.log(`Deleting ${ids.length} nodes: ${ids}`);

  let createPromises = ids.map(async (id) =>  await lnc.removeLinodeInstances(id));

  try {
    let createdProxies = await Promise.all(createPromises);
    console.log(createdProxies);
    console.log('Completed');
  } catch (error) {
    console.log(error);
  }

};

main();