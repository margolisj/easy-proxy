import { Proxy } from './models';
import { loadConfig } from './config';
import { delay, getRandomProxyData, propmtPromise} from './utils';
import * as node_ssh from 'node-ssh';
import * as fs from 'fs';
const randomstring = require('randomstring');
import * as waitPort from 'wait-port';

import * as Linode from 'linode-api-node';
// import * as DigitalOcean from 'do-wrapper';
const DigitalOcean = require('do-wrapper');

const config = loadConfig();
const configNoAuth = 'https://gist.githubusercontent.com/margolisj/ff35ff91df747e5917174d7cca0cf769/raw/4f7296169a9b081998103fdedb41cc2e9281c648/conf';
const configAuth = 'https://gist.githubusercontent.com/margolisj/8b2cfd84f8ad7d3ddf1743c8046fe680/raw/7a57321da876cca76ae8e19e76fdf1264aad6cf9/squid_conf_with_auth.conf';

interface Provider {
  createInstance(retries: number);
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

  async createInstance (retries:number  = 3) {
    let region = config.linode.region;
    let instanceType = 'g5-nanode-1';
    let imageType = 'linode/centos7';
  
    try {
      let createResponse = await this.lnc.createLinodeInstance({
        'region': region,
        'type': instanceType,
        'image': imageType,
        'root_pass': this.rootpass
      });
  
      return {
        id: createResponse['id'],
        ip: createResponse['ipv4'][0]
      };

    } catch (err) {
      console.log(err['message']);
  
      if (retries == 0) {
        return null;
      };
  
      return this.createInstance(retries - 1);
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
    try {
      let dropletName = randomstring.generate(14);
      let {proxyUsername, proxyPassword, port} = getRandomProxyData();

      // // Create and wait for running
      let {id, ip} = await this.createInstance();
      console.log(`${dropletName} | Waiting for droplet to initialize`);
      let success = await this.waitForCreation(id);
      console.log(`${dropletName} | Created id: ${id} with ip: ${ip}`);
      await waitPort({
        host: ip,
        port: 22,
        output: 'silent'
      });

      let password = this.rootpass;
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
      console.log(`${dropletName} | Connected to droplet`);

      const conf = this.auth ? configAuth : configNoAuth;
  
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
      console.log(`${dropletName} | Finished setup id: ${id} with ip: ${ip}`);
  
      let proxy;
      if (this.auth) {
        proxy = new Proxy (ip, '3128', proxyUsername, proxyPassword);
      } else {
        proxy = new Proxy (ip, '3128');
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

  async createInstance(dropletName, retries: number = 3){
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

    try {
      let response = await this.api.dropletsCreate(dropletData);
      return response['body']['droplet']['id'];
    } catch(err) {
      console.log(err);
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
      await ssh.connect({
        host: ip,
        username: 'root',
        port: 22,
        privateKey: config.digital_ocean.rsa_id_path,
        passphrase: config.digital_ocean.ssh_passphrase
      });
      console.log(`${dropletName} | Connected to droplet`);

      const conf = this.auth ? configAuth : configNoAuth;

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
      console.log(`${dropletName} | Finished setup id: ${id} with ip: ${ip}`);

      let proxy;
      if (this.auth) {
        proxy = new Proxy (ip, '3128', proxyUsername, proxyPassword);
      } else {
        proxy = new Proxy (ip, '3128');
      }

      return proxy;

    } catch (err) {
      console.log(`${err}`);
      return new Proxy ('', '');
    }
  }

}

let main = async () => {
  // console.log(`
  //   Creating proxies on 
  // `)

  try {
    let provider: Provider;
    if (config.provider === 'digital_ocean') {
      provider = new DigitalOceanProvider();
    } else if (config.provider === 'linode'){
      provider = new LinodeProvider();
    } else {
      throw new Error('Unable to determine provider');
    }

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

main();
