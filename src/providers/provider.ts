import { passwordAuthConfig } from '../configs/squidConfigPasswordAuth';
import { ipAuthConfig } from '../configs/squidConfigIPAuth';
import { noAuthConfig } from '../configs/squidConfigNoAuth';
import { AuthType, Config } from '../models';
import { Proxy } from '../proxy';

export interface Provider {
  createInstance(dropletName:string, retries: number);
  waitForCreation(id: string);
  makeInstance(retries?: number);
}

export class HasAuth {
  getSquidConfig(config: Config, port: string): string {
    const type = config.auth.type;
    if (type === AuthType.USERPASS) {
      return passwordAuthConfig(port);
    } else if (type === AuthType.IP) {
      return ipAuthConfig(port, config.auth.ip);
    }
    
    console.log('Using none ' + port);
    return noAuthConfig(port);
  }

  createProxy(config: Config, ip, port, proxyUsername?, proxyPassword?): Proxy {
    try {
      const type = config.auth.type;
      if (type === AuthType.USERPASS) {
        // console.log('Using user/pass create');
        return new Proxy(ip, port, proxyUsername, proxyPassword);
      } else {
        // console.log('Using no user/pass create');
        return new Proxy(ip, port, null, null);
      }
    } catch (err) {
      console.log('Error creating proxy function: ' + err);
    }

    return new Proxy(ip, port, null, null);
  }

}
