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
    console.log(config);
    console.log(config.auth);
    // console.log(config.auth.type);
    // const type = config.auth.type as AuthType;
    // if (type === AuthType.USERPASS) {
    //   console.log('Using user/pass ' + port);
    //   return passwordAuthConfig(port);
    // } else if (type === AuthType.IP) {
    //   console.log('Using ip ' + port);
    //   return ipAuthConfig(port, config.auth.ip);
    // } else {
    //   console.log('Using none ' + port);
    //   return noAuthConfig(port);
    // }
    return noAuthConfig(port);
  }

  createProxy(config, ip, port, proxyUsername?, proxyPassword?): Proxy {
    try {
      console.log(config.auth);
      console.log(config.auth.type);
      const type = config.auth.type as AuthType;
    
    if (type === AuthType.USERPASS) {
      console.log('Using user/pass create');
      return new Proxy(ip, port, proxyUsername, proxyPassword);
    } else {
      console.log('Using none create');
      return new Proxy(ip, port, null, null);
    }

    } catch (err) {
  }
}
