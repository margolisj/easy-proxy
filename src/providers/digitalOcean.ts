const DigitalOcean = require('do-wrapper').default;
// import * as do_wrapper from 'do-wrapper';
import { delay, getRandomProxyData, applyMixins} from '../utils';
import * as randomstring from 'randomstring';
import * as waitPort from 'wait-port';
import * as node_ssh from 'node-ssh';
import { Config } from '../models';
import { Provider, HasAuth } from './provider';
import { Proxy } from '../proxy';

export class DigitalOceanProvider implements Provider, HasAuth {
  private api;
  private dropletName: string;
  private config: Config;

  constructor(config) {
    this.config = config;
    this.api = new DigitalOcean(config.digital_ocean.api_key);
  }

  async createInstance(dropletName, retries: number = 3) {
    let dropletData = {
      name: dropletName,
      region: this.config.digital_ocean.region,
      size: '512mb',
      image: 'centos-7-x64',
      ssh_keys: [ this.config.digital_ocean.ssh_key_id ],
      backups: false,
      ipv6: false,
      user_data: null,
      private_networking: false,
      volumes: null,
      tags: [ this.config.digital_ocean.tag ]
    };

    try {
      let response = await this.api.dropletsCreate(dropletData);
      return response['body']['droplet']['id'];
    } catch (err) {
      console.log(`${dropletName} Error creating node, retry ${retries}: \n${err['message']}`);
      if (retries == 0) {
        throw Error('Unable to create instance.');
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
        console.log("Error waiting: " + err);
        throw err;
      }
    }
    await delay(5000); // Added for ssh issues
    return response['body']['droplet']['networks']['v4'][0]['ip_address'];
  }

  async makeInstance(retries: number = 3): Promise<Proxy> {
    const dropletName = randomstring.generate(14);
    let {proxyUsername, proxyPassword, port} = getRandomProxyData();

    try {
      // Create and wait for running
      const id = await this.createInstance(dropletName);
      console.log(`${dropletName} | Waiting for droplet to initialize`);
      const ip = await this.waitForCreation(id);
      console.log(`${dropletName} | Created id: ${id} with ip: ${ip}:${port}`);
      
      try {
        await waitPort({
          host: ip,
          port: 22,
          output: 'silent'
        });
      } catch (err) {
        console.log('Error during waitPort: ' + err);
        throw err;
      }
    
      const ssh = new node_ssh();
      try {
        await ssh.connect({
          host: ip,
          username: 'root',
          port: 22,
          privateKey: this.config.digital_ocean.rsa_id_path,
          passphrase: this.config.digital_ocean.ssh_passphrase
        });
      } catch (err) {
        console.log('Error connecting to SSH.')
        throw err;
      }

      console.log(`${dropletName} | Connected to droplet`);
      const conf: string = this.getSquidConfig(this.config, port);
      console.log(`${dropletName} | Setting up droplet`);

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

      return this.createProxy(this.config, ip, port, proxyUsername, proxyPassword);

    } catch (err) {
      console.log(`${dropletName} | Error ${err}`);
      return new Proxy('', '');
    }
  }

  getSquidConfig: (config, port) => ''
  createProxy: (config, ip, port, proxyUsername, proxyPassword) => Proxy
}
applyMixins(DigitalOceanProvider, [HasAuth]);
