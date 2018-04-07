const config = require('./config');
const randomstring = require('randomstring');
const prompt = require('prompt');
const async = require('async');
const SSH = require('simple-ssh');
const DigitalOcean = require('do-wrapper');
const fs = require('fs');
const waitPort = require('wait-port');
require('console.table');

api = new DigitalOcean(config.digital_ocean.api_key, '9999');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

let main = () => {
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
    let proxyData = getRandomProxyData(proxyCount);

    if (config.provider === 'digital_ocean') {
      let createPromises = proxyData.map((proxy) => createDroplet(proxy));
      try {
        let createdProxies = await Promise.all(createPromises);
        console.table(createdProxies);
        printProxiesTaskBot(createdProxies);
      } catch (error) {
        console.log(error);
      }

    } else if (config.provider === 'linode') {

    } else {
      console.error('Unknown provider');
      process.exit();
    }

  });
};

main();



let getRandomProxyData = (proxyCount) => {
  let proxyData = [];
  for (let i = 0; i < proxyCount; i++) {
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

    proxyData.push({
      username: username,
      password: password,
      port: port
    });
  }
  return proxyData;
}

let createDroplet = async (proxy) => {
  let dropletName = randomstring.generate(14);
  let dropletData = {
    name: dropletName,
    region: config.digital_ocean.region,
    size: '512mb',
    image: 'centos-7-x64',
    ssh_keys: [config.digital_ocean.ssh_key_id],
    backups: false,
    ipv6: false,
    user_data: null,
    private_networking: false,
    volumes: null,
    tags: [ 'easy' ]
  };

  console.log(`${dropletName} | Creating droplet on ${config.digital_ocean.region}`);

  try {
    await api.dropletsCreate(dropletData);
    console.log(`${dropletName} | Waiting for droplet to initialize`);
    let droplet = await waitForCreation(dropletName);
    console.log(`${dropletName} | Droplet created`);
    let host = droplet.networks.v4[0].ip_address;
    await waitForSsh(host);
    console.log(`${dropletName} | Droplet connected to`);
    console.log(`${dropletName} | Setting up proxy ${host} ${proxy.username}:${proxy.password}`);
    return proxySetup(dropletName, droplet.id, host, proxy.username, proxy.password, 3);
  } catch(err) {
    console.log(err);
  }
}

let delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let waitForCreation = (dropletName) => {
  return new Promise((resolve, reject) => {
    let interval = setInterval(() => {
      api.dropletsGetAll({}).then((data) => {
        let droplet = data.body.droplets.find((droplet) => {
          return droplet.name === dropletName;
        });
        if (droplet && droplet.status === 'active') {
          console.log(`${dropletName} | Droplet is active`)
          clearInterval(interval);
          resolve(droplet);
        }
      });
    }, 5000);
  });
};

let waitForSsh = (host) => {
  //console.log(`Waiting for ssh for ${host}`)
  return new Promise((resolve, reject) => {
    waitPort({
      host: host,
      port: 22,
      output: 'silent'
    }).then((open) => {
      if (open) {
        // Adding 8 seconds b/c it can still time out wtf
        setTimeout(resolve(), 8000);
      } else console.log(`${host} | The port did not open before the timeout...`);
    }).catch(err => reject(err));
  });
};

const configNoAuth = 'https://gist.githubusercontent.com/margolisj/ff35ff91df747e5917174d7cca0cf769/raw/4f7296169a9b081998103fdedb41cc2e9281c648/conf';
const configAuth = 'https://gist.githubusercontent.com/margolisj/8b2cfd84f8ad7d3ddf1743c8046fe680/raw/7a57321da876cca76ae8e19e76fdf1264aad6cf9/squid_conf_with_auth.conf';


let proxySetup = (dropletName, id, host, username, password, retries=0) => {
  return new Promise((resolve, reject) => {

    let ssh = new SSH({
      host: host,
      user: 'root',
      key: fs.readFileSync(config.digital_ocean.rsa_id_path.replace(/(\s)/, "\\ ")),
      passphrase: config.digital_ocean.ssh_passphrase,
      timeout: 99999
    });

    const conf = config.auth ? configAuth : configNoAuth;

    ssh.exec(
      `yum install squid httpd-tools wget -y &&
      touch /etc/squid/passwd &&
      htpasswd -b /etc/squid/passwd ${username} ${password} &&
      wget -O /etc/squid/squid.conf ${conf} --no-check-certificate &&
      touch /etc/squid/blacklist.acl &&
      systemctl restart squid.service && systemctl enable squid.service &&
      iptables -I INPUT -p tcp --dport 3128 -j ACCEPT &&
      iptables-save`, {
        // err: function(stderr) {
        //   console.log(stderr);
        // },
        // out: function(stdout) {
        //   console.log(stdout);
        // },
        //exit: (code, stdout, stderr) => console.log(`${code} ${stdout} ${stderr}`)
      }).start({
        success: _ => {
          console.log(`${dropletName} | Successfully execueting code on server ${host}`);
          resolve({
            'IP': host,
            'Port': '3128',
            'Username': username,
            'Password': password
          });
        },
        fail: (err) => {
          console.log(`${dropletName} | Unable to execuete code on server ${host}`)
          console.log(`${dropletName} | Retry ${retries - 1}`);

          if (retries > 0) {
            return resolve(
              proxySetup(
                dropletName, id, host, username, password, retries - 1
              )
            );
          } else {
            reject(err);
          }
        }
    });
  });
};

let printProxiesSupreme = (createdProxies) => {
  createdProxies.forEach(proxy => {
    console.log(`
    curl -x http://${proxy.IP}:${proxy.Port} --proxy-user ${proxy.Username}:${proxy.Password} -L http://www.supremenewyork.com/mobile_stock.json -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 11_0_3 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Mobile/15A432"
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
    // console.log(`${proxy.Username}:${proxy.Password}@${proxy.IP}:${proxy.Port}`);
    console.log(`${proxy.IP}:${proxy.Port}`);

  });
};