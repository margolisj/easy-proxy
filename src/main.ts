import { Proxy } from './proxy';
import { loadConfig } from './config';
import { delay, getRandomProxyData, propmtPromise} from './utils';
import * as node_ssh from 'node-ssh';
import * as fs from 'fs';
const randomstring = require('randomstring');
import * as waitPort from 'wait-port';

import { noAuthConfig } from './configs/squidConfigNoAuth';
import { passwordAuthConfig } from './configs/squidConfigPasswordAuth';

import * as Linode from 'linode-api-node';
const DigitalOcean = require('do-wrapper');

const config = loadConfig();

interface Provider {
  createInstance(dropletName:string, retries: number);
  waitForCreation(id: string);
  makeInstance(retries?: number);
}

class LinodeProvider implements Provider {
  private lnc;
  private rootpass: string;
  private auth: boolean;
  private dropletName: string;

  constructor() {
    this.lnc = new Linode(config['linode']['apiKey']);
    this.rootpass = config.linode.sshPassphrase;
    this.auth = config.auth;
  }

  async createInstance(dropletName:string, retries:number  = 3) {
    let region = config.linode.region;
    let instanceType = 'g5-nanode-1';
    let imageType = 'linode/centos7';
  
    try {
      let createResponse = await this.lnc.createLinodeInstance({
        'region': region,
        'type': instanceType,
        'image': imageType,
        'root_pass': this.rootpass,
        'label': `${config.linode.label}-${randomstring.generate(5)}`
      });
  
      return {
        id: createResponse['id'],
        ip: createResponse['ipv4'][0]
      };

    } catch (err) {
      console.log(`${dropletName} Error creating node, retry ${retries}: \n`);
      console.log(err['message']);
  
      if (retries == 0) {
        return null;
      };
  
      return this.createInstance(dropletName, retries - 1);
    }
  
  };

  async waitForCreation(id: string) {
    var status = '';
    while (status !== 'running') {
      try {
        let response =  await this.lnc.getLinodeInstances(id);
        status = response.status;
        await delay(5000);
      } catch (err) {
        console.log(err);
        return false;
      }
    }
  
    await delay(5000); // Added for ssh issue
    return true;
  }

  async makeInstance(retries: number = 3): Promise<Proxy> {
    let dropletName = randomstring.generate(14);
    let {proxyUsername, proxyPassword, port} = getRandomProxyData();

    try {
      let id, ip;
      try {
        // Create and wait for running
        ({id, ip} = await this.createInstance(dropletName));
        console.log(`${dropletName} | Waiting for linode to initialize`);
        let success = await this.waitForCreation(id);
        console.log(`${dropletName} | Created id: ${id} with ip: ${ip}:${port}`);
        await waitPort({
          host: ip,
          port: 22,
          output: 'silent'
        });
      } catch (err) {
        console.log(`${dropletName} | Error waiting for port ${err}`);
        throw err;
      }

      let password = this.rootpass;
      let ssh = new node_ssh();
      try {
        await ssh.connect({
          host: ip,
          username: 'root',
          port: 22,
          readyTimeout: 60000,
          password,
          tryKeyboard: true,
          onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
              if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
                finish([password])
              }
            }
        });
        console.log(`${dropletName} | Connected to droplet`);
      } catch (err) {
        console.log(`${dropletName} | Unable to ssh ${err}`);
        throw err;
      }

      try {
        const conf: string = this.auth ? passwordAuthConfig(port) : noAuthConfig(port);
    
        let result = await ssh.execCommand(
          `yum install squid httpd-tools wget -y &&
          touch /etc/squid/passwd &&
          htpasswd -b /etc/squid/passwd ${proxyUsername} ${proxyPassword} &&
          conf="${conf}" &&
          echo "$conf" > /etc/squid/squid.conf &&
          touch /etc/squid/blacklist.acl &&
          systemctl restart squid.service && systemctl enable squid.service &&
          iptables -I INPUT -p tcp --dport ${port} -j ACCEPT &&
          iptables-save`, { cwd:'~' }
        );
        console.log(`${dropletName} | Finished setup id: ${id} with ip: ${ip}`);
      } catch (err) {
        console.log(`${dropletName} | Failed to execute ssh command: ${err}`)
        throw err;
      }

      let proxy;
      if (this.auth) {
        proxy = new Proxy (ip, port, proxyUsername, proxyPassword);
      } else {
        proxy = new Proxy (ip, port);
      }
      return proxy;

    } catch (err) {
      console.log(`${err}`);
      return new Proxy ('', '');
    }

  }

};

class DigitalOceanProvider implements Provider {
  private api;
  private auth: boolean;
  private dropletName: string;

  constructor() {
     this.api = new DigitalOcean(config.digital_ocean.api_key, '9999');
     this.auth = config.auth;
  }

  async createInstance(dropletName, retries: number = 3) {
    let dropletData = {
      name: dropletName,
      region: config.digital_ocean.region,
      size: config.digital_ocean.instance_size,
      image: 'docker-16-04',
      ssh_keys: config.digital_ocean.ssh_key_ids,
      backups: false,
      ipv6: false,
      user_data: null,
      private_networking: false,
      volumes: null,
      tags: [ config.digital_ocean.tag ]
    };

    try {
      let response = await this.api.dropletsCreate(dropletData);
      return response['body']['droplet']['id'];
    } catch(err) {
      console.log(`${dropletName} Error creating node, retry ${retries}: \n${err['message']}`);
      if (retries == 0) {
        return null;
      };
  
      return this.createInstance(dropletName, retries - 1);
    }
  }
  
  async waitForCreation(id: string) {
    var status = '';
    let ip;
    var response;
    while (status !== 'active') {
      try {
        await delay(5000);
        response =  await this.api.dropletsGetById(id);
        if (response) {
          status = response['body']['droplet'].status;
        }
      } catch (err) {
        console.log(err);
        return false;
      }
    }
    await delay(5000); // Added for ssh issues
    return response['body']['droplet']['networks']['v4'][0]['ip_address'];
  }

  async makeInstance(retries: number = 3): Promise<Proxy> {
    const dropletName = randomstring.generate(14);

    try {
      let {proxyUsername, proxyPassword, port} = getRandomProxyData();
      // Create and wait for running
      let id = await this.createInstance(dropletName);
      console.log(`${dropletName} | Waiting for droplet to initialize`);
      let ip = await this.waitForCreation(id);
      console.log(`${dropletName} | Created id: ${id} with ip: ${ip}`);
      await waitPort({
        host: ip,
        port: 22,
        output: 'silent'
      });

      let ssh = new node_ssh();
      let ssh_settings = {
        host: ip,
        username: 'root',
        port: 22,
        privateKey: config.digital_ocean.rsa_id_path
      }
      if (config.digital_ocean.ssh_passphrase) {
        ssh_settings['passphrase'] = config.digital_ocean.ssh_passphrase
      }
      await ssh.connect(ssh_settings); 
      console.log(`${dropletName} | Connected to droplet`);

      const conf = this.auth ? passwordAuthConfig(port) : noAuthConfig(port);
      
      let result = await ssh.execCommand(
        `apt-get install wget htop -y &&
        ufw allow 5901 &&
        ufw allow 6901 &&
        ufw allow 3000 &&
        wget --quiet -O cart-goblin-worker.tar.gz "${config.docker.download_url}" &&
        tar xfz cart-goblin-worker.tar.gz &&
        docker load -i cart-goblin-worker.tar && 
        docker run -d --security-opt 'seccomp=./seccomp-chrome.json' -p ${config.docker.worker_port}:${config.docker.worker_port} -p ${config.docker.vnc_port}:${config.docker.vnc_port} -p ${config.docker.vnc_web_ui_port}:${config.docker.vnc_web_ui_port} cart-goblin-worker`,
        { cwd:'~' }
      );
      result = await ssh.execCommand(
        `docker ps`, { cwd:'~' }
      );
      console.log(`${dropletName} | Finished setup id: ${id} with ip: ${ip}. Worker on port ${config.docker.worker_port}. Connect to VNC Web UI at http://${ip}:${config.docker.vnc_web_ui_port}`);

    } catch (err) {
      console.log(`${dropletName} | Error ${err}`);
      return new Proxy ('', '');
    }
  }

}

let main = async () => {
  try {
    let provider: Provider;
    if (config.provider === 'digital_ocean') {
      provider = new DigitalOceanProvider();
    } else if (config.provider === 'linode'){
      provider = new LinodeProvider();
    } else {
      throw new Error('Unable to determine provider');
    }

    console.log(`
      Creating proxies on ${config.provider}:
      region: ${config[config.provider]['region']}
      auth: ${config.auth}
    `);

    let result = await propmtPromise([{
      name: 'count',
      required: true,
      description: 'Number of proxies to make'
    }]);

    let proxyCount = parseInt(result['count']);
    console.log(`Creating proxies | ${proxyCount}`);

    let createPromises = Array.from(Array(proxyCount))
      .map(async () =>  await provider.makeInstance());

    let createdProxies = await Promise.all(createPromises);
    console.log(createdProxies);
    createdProxies.forEach(proxy => console.log(proxy.toString()))
  } catch (err) {
    console.log(err);
  }

  console.log('Completed');
};

let austin_main = async () => {
  try {
    let provider: Provider;
    if (config.provider === 'digital_ocean') {
      provider = new DigitalOceanProvider();
    } else if (config.provider === 'linode'){
      provider = new LinodeProvider();
    } else {
      throw new Error('Unable to determine provider');
    }

    console.log(`
      Creating worker on ${config.provider}
      region: ${config[config.provider]['region']}
    `);

    await provider.makeInstance();
  } catch (err) {
    console.log(err);
  }

  console.log('Completed');
  process.exit(0)
};

austin_main();
