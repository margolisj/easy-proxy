const Linode = require('linode-api-node');
const config = require('./config');
const randomstring = require('randomstring');
const prompt = require('prompt');
const async = require('async');
const node_ssh = require('node-ssh');
const fs = require('fs');
const waitPort = require('wait-port');

const API_KEY = config.linode.apiKey;
const lnc = new Linode(API_KEY);


let printProxiesSupreme = (createdProxies) => {
  // curl -x http://${proxy.IP}:${proxy.Port} --proxy-user ${proxy.Username}:${proxy.Password} -L http://www.supremenewyork.com/mobile_stock.json -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 11_0_3 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Mobile/15A432"

  createdProxies.forEach(proxy => {
    console.log(`
    {
        'http': 'http://${proxy.Username}:${proxy.Password}@${proxy.IP}:${proxy.Port}/',
        'https': 'http://${proxy.Username}:${proxy.Password}@${proxy.IP}:${proxy.Port}/'
    }`);
  });
};

let printProxiesAdidas = (createdProxies) => {
  createdProxies.forEach(proxy => {
    console.log(`
    {
      ip_port: '${proxy.IP}:${proxy.Port}',
      user: '${proxy.Username}',
      pass: '${proxy.Password}'
    },`);
  });
};

let printProxiesTaskBot = (createdProxies) => {
  createdProxies.forEach(proxy => {
    console.log(`${proxy.IP}:${proxy.Port}`);
  });
};

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
let createInstance = async () => {
  let region = 'us-east';
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
    return null;
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

/*
{ data:
   [ { id: 'linode/slackware13.37',
       size: 600,
       description: null,
       created: '2011-06-05T19:11:59',
       deprecated: true,
       vendor: 'Slackware',
       label: 'Slackware 13.37',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/slackware14.1',
       size: 1000,
       description: null,
       created: '2013-11-25T16:11:02',
       deprecated: true,
       vendor: 'Slackware',
       label: 'Slackware 14.1',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/ubuntu14.04lts',
       size: 1500,
       description: null,
       created: '2014-04-17T19:42:07',
       deprecated: true,
       vendor: 'Ubuntu',
       label: 'Ubuntu 14.04 LTS',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/centos6.8',
       size: 1024,
       description: null,
       created: '2014-04-28T19:19:34',
       deprecated: true,
       vendor: 'CentOS',
       label: 'CentOS 6.8',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/centos7',
       size: 1500,
       description: null,
       created: '2014-07-08T14:07:21',
       deprecated: false,
       vendor: 'CentOS',
       label: 'CentOS 7',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/debian7',
       size: 600,
       description: null,
       created: '2014-09-24T17:59:32',
       deprecated: true,
       vendor: 'Debian',
       label: 'Debian 7',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/debian8',
       size: 1024,
       description: '',
       created: '2015-04-27T20:26:41',
       deprecated: false,
       vendor: 'Debian',
       label: 'Debian 8',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/ubuntu16.04lts',
       size: 1024,
       description: null,
       created: '2016-04-22T18:11:29',
       deprecated: false,
       vendor: 'Ubuntu',
       label: 'Ubuntu 16.04 LTS',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/arch',
       size: 1500,
       description: null,
       created: '2016-06-13T20:31:34',
       deprecated: false,
       vendor: 'Arch',
       label: 'Arch 2018.02.05',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/slackware14.2',
       size: 6000,
       description: null,
       created: '2016-10-13T13:14:34',
       deprecated: false,
       vendor: 'Slackware',
       label: 'Slackware 14.2',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/gentoo2018.01.15',
       size: 5500,
       description: null,
       created: '2016-10-25T17:31:25',
       deprecated: false,
       vendor: 'Gentoo',
       label: 'Gentoo 2018-01-15',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/opensuseleap42.2',
       size: 1700,
       description: null,
       created: '2016-11-17T19:52:54',
       deprecated: true,
       vendor: 'openSUSE',
       label: 'openSUSE Leap 42.2',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/containerlinux',
       size: 5000,
       description: null,
       created: '2017-06-06T20:44:00',
       deprecated: false,
       vendor: 'CoreOS',
       label: 'CoreOS Container Linux',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/debian9',
       size: 1250,
       description: null,
       created: '2017-06-16T20:02:29',
       deprecated: false,
       vendor: 'Debian',
       label: 'Debian 9',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/fedora26',
       size: 1500,
       description: null,
       created: '2017-07-12T12:23:15',
       deprecated: false,
       vendor: 'Fedora',
       label: 'Fedora 26',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/opensuse42.3',
       size: 1900,
       description: null,
       created: '2017-07-27T18:03:05',
       deprecated: false,
       vendor: 'openSUSE',
       label: 'openSUSE Leap 42.3',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/ubuntu17.10',
       size: 2500,
       description: null,
       created: '2017-10-19T20:19:16',
       deprecated: false,
       vendor: 'Ubuntu',
       label: 'Ubuntu 17.10',
       created_by: 'linode',
       type: 'manual',
       is_public: true },
     { id: 'linode/fedora27',
       size: 1900,
       description: null,
       created: '2017-12-14T21:06:30',
       deprecated: false,
       vendor: 'Fedora',
       label: 'Fedora 27',
       created_by: 'linode',
       type: 'manual',
       is_public: true } ],
  page: 1,
  pages: 1,
  results: 18 }
  */
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

let delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let waitForCreation = async (dropletName) => {
  var status = '';
  while (status !== 'running') {
    try {
      let response =  await lnc.getLinodeInstances(dropletName);
      status = response.status;
      console.log(status);
      await delay(5000);
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  return true;
};

const configNoAuth = 'https://gist.githubusercontent.com/margolisj/ff35ff91df747e5917174d7cca0cf769/raw/4f7296169a9b081998103fdedb41cc2e9281c648/conf';
const configAuth = 'https://gist.githubusercontent.com/margolisj/8b2cfd84f8ad7d3ddf1743c8046fe680/raw/7a57321da876cca76ae8e19e76fdf1264aad6cf9/squid_conf_with_auth.conf';

let deleteInstances = async () => {
    // Delete droplets
    let res = await lnc.getLinodeInstances();
    let nodes = res.data;
    let deletePromises = nodes.map(async (node) => await lnc.removeLinodeInstances(node.id));
    let results = await Promise.all(deletePromises);
    console.log();
};

let makeInstance = async () => {
  try {
    let {proxyUsername, proxyPassword, port} = getRandomProxyData();
    // // Create and wait for running
    let {id, ip} = await createInstance();
    console.log(`Created id: ${id} with ip: ${ip}`);
    let success = await waitForCreation(id);

    let password = config.linode.sshPassphrase;

    // let ip = '45.79.128.64';
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

    const conf = configNoAuth;

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
    console.log(result);

    // TODO: Different shape if not auth
    let proxies = [ {
      IP: ip,
      Port: 3128,
      Username: proxyUsername,
      Password: proxyPassword
    }];

    printProxiesSupreme(proxies);

  } catch (err) {
    console.log(err);
  }
};

let main = async () => {
  prompt.get([{
    name: 'count',
    required: true,
    description: 'Number of proxies to make'
  }], async (err, result) => {
    if (err) {
      process.exit();
    }

    let proxyCount = parseInt(result.count);
    console.log(`Creating proxies | ${proxyCount}`);

    let createPromises = Array.from(Array(proxyCount))
                              .forEach(async () => await makeInstance());

    try {
      let createdProxies = await Promise.all(createPromises);
      console.table(createdProxies);
    } catch (error) {
      console.log(error);
    }

  });
};
main();
// deleteInstances();