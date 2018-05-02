export {};

const Linode = require('linode-api-node');
import { loadConfig } from './config';
const randomstring = require('randomstring');
const prompt = require('prompt');
const async = require('async');
const node_ssh = require('node-ssh');
const fs = require('fs');
const waitPort = require('wait-port');
const utils = require('./utils');
import { Proxy } from './models';

const config = loadConfig();
const lnc = new Linode(config['linode']['apiKey']);

/*
updated: '2018-04-05T04:22:19',
  alerts:
   { io: 10000,
     cpu: 90,
     network_out: 10,
     network_in: 10,
     transfer_quota: 80 },
  specs: { transfer: 1000, disk: 20480, memory: 1024, vcpus: 1 },
  image: null,
  region: 'us-east',
  created: '2018-04-05T04:22:19',
  label: 'linode7497129',
  type: 'g5-nanode-1',
  ipv6: '2600:3c03::f03c:91ff:fe7d:089a/64',
  status: 'provisioning',
  id: 7497129,
  group: '',
  backups: { schedule: { day: null, window: null }, enabled: false },
  hypervisor: 'kvm',
  ipv4: [ '45.79.140.169' ]
  */
let createInstance = async (retries = 3) => {
  let region = 'us-east'; //  'eu-west'
  let instanceType = 'g5-nanode-1';
  let imageType = 'linode/centos7';

  try {
    // Create node
    let createResponse = await lnc.createLinodeInstance({
      'region': region,
      'type': instanceType,
      'image': imageType,
      'root_pass': config.linode.sshPassphrase
    });

    return {
      id: createResponse['id'],
      ip: createResponse['ipv4'][0]
    };
  } catch (err) {
    console.log(err['message']);

    if (retries == 0) {
      return null
    };

    return createInstance(retries - 1);
  }

};

/* 
{
{ id: 'us-central', country: 'us' },
{ id: 'us-west', country: 'us' },
{ id: 'us-southeast', country: 'us' },
{ id: 'us-east', country: 'us' },
{ id: 'eu-west', country: 'uk' },
{ id: 'ap-south', country: 'sg' },
{ id: 'eu-central', country: 'de' },
{ id: 'ap-northeast', country: 'jp' },
{ id: 'ap-northeast-1a', country: 'jp' }
}*/
let getRegions = async () => {
  return await lnc.getRegions();
};

/*
{ label: 'Linode 1024',
price: [Object],
vcpus: 1,
network_out: 1000,
id: 'g5-nanode-1',
transfer: 1000,
disk: 20480,
memory: 1024,
addons: [Object],
class: 'nanode' },
 */
let getTypes = async () => {
  return await lnc.getLinodeTypes();
};


let getDistributions = async () => {
  try {
    return await lnc.getLinodeDistributions();
  } catch (err) {
    return [];
  }
}

let getRandomProxyData = () => {
  let port = Math.floor(Math.random() * 6500) + 2000;

  let username = randomstring.generate({
    length: 7,
    charset: 'alphabetic',
    capitalization: 'lowercase'
  });

  let password = randomstring.generate({
    length: 14,
    charset: 'alphabetic',
    capitalization: 'lowercase'
  });

  return {
      proxyUsername: username,
      proxyPassword: password,
      port: port
  };
};


let waitForCreation = async (dropletName) => {
  var status = '';
  while (status !== 'running') {
    try {
      let response =  await lnc.getLinodeInstances(dropletName);
      status = response.status;
      console.log(status);
      await utils.delay(5000);
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  // Added for ssh issue
  await utils.delay(5000);
  return true;
};

const configNoAuth = 'https://gist.githubusercontent.com/margolisj/ff35ff91df747e5917174d7cca0cf769/raw/4f7296169a9b081998103fdedb41cc2e9281c648/conf';
const configAuth = 'https://gist.githubusercontent.com/margolisj/8b2cfd84f8ad7d3ddf1743c8046fe680/raw/7a57321da876cca76ae8e19e76fdf1264aad6cf9/squid_conf_with_auth.conf';


let makeInstance = async (retries = 0): Promise<Proxy> => {
  try {
    let {proxyUsername, proxyPassword, port} = getRandomProxyData();
    // // Create and wait for running
    let {id, ip} = await createInstance();
    console.log(`Created id: ${id} with ip: ${ip}`);
    let success = await waitForCreation(id);

    let password = config.linode.sshPassphrase;

    let ssh = new node_ssh();
    await ssh.connect({
      host: ip,
      username: 'root',
      port: 22,
      password,
      tryKeyboard: true,
      onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
          if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
            finish([password])
          }
        }
    });

    const conf = config['auth'] ? configAuth : configNoAuth;

    let result = await ssh.execCommand(
      `yum install squid httpd-tools wget -y &&
      touch /etc/squid/passwd &&
      htpasswd -b /etc/squid/passwd ${proxyUsername} ${proxyPassword} &&
      wget -O /etc/squid/squid.conf ${conf} --no-check-certificate &&
      touch /etc/squid/blacklist.acl &&
      systemctl restart squid.service && systemctl enable squid.service &&
      iptables -I INPUT -p tcp --dport 3128 -j ACCEPT &&
      iptables-save`, { cwd:'~' }
    );
    console.log(`Finished setup id: ${id} with ip: ${ip}`);

    let proxy;
    if (config['auth']) {
      proxy = new Proxy (ip, '3128', proxyUsername, proxyPassword);
    } else {
      proxy = new Proxy (ip, '3128');
    }

    console.log(proxy);
    return proxy;

  } catch (err) {
    console.log(`${err}`);
    return new Proxy ('', '');
  }
};

let main = async () => {
  prompt.get([{
    name: 'count',
    required: true,
    description: 'Number of proxies to make'
  }], async (err, result) => {
    if (err) {
      console.log(err);
      process.exit();
    }

    let proxyCount = parseInt(result.count);
    console.log(`Creating proxies | ${proxyCount}`);

    let createPromises = Array.from(Array(proxyCount))
                              .map(async () =>  await makeInstance());

    try {
      let createdProxies = await Promise.all(createPromises);
      console.log(createdProxies);
      createdProxies.forEach(proxy => console.log(proxy.toString()))
    } catch (error) {
      console.log(error);
    }

    console.log('Completed');

  });
};

main();
