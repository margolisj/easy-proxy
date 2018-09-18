import * as Linode from 'linode-api-node';
import { delay, getRandomProxyData, propmtPromise, applyMixins} from '../utils';
const randomstring = require('randomstring');
import * as waitPort from 'wait-port';
import * as node_ssh from 'node-ssh';
import { Config } from '../models';
import { Provider, HasAuth } from './interfaces';
import { Proxy } from '../proxy';

export class LinodeProvider implements Provider, HasAuth {
  private lnc;
  private rootpass: string;
  private dropletName: string;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.lnc = new Linode(config['linode']['apiKey']);
    this.rootpass = config.linode.sshPassphrase;
  }

  async createInstance(dropletName:string, retries:number  = 3) {
    let region = this.config.linode.region;
    let instanceType = 'g5-nanode-1';
    let imageType = 'linode/centos7';
  
    try {
      let createResponse = await this.lnc.createLinodeInstance({
        'region': region,
        'type': instanceType,
        'image': imageType,
        'root_pass': this.rootpass,
        'label': `${this.config.linode.label}-${randomstring.generate(5)}`
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
      } catch (err) {
        console.log(`${dropletName} | Failed to execute ssh command: ${err}`)
        throw err;
      }

      return this.createProxy(ip, port, proxyUsername, proxyPassword);

    } catch (err) {
      console.log(`${err}`);
      return new Proxy ('', '');
    }
  }

  getSquidConfig: (config, port) => ''
  createProxy: (ip, port, proxyUsername, proxyPassword) => Proxy

};
applyMixins(LinodeProvider, [HasAuth]);