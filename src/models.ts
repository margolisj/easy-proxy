
enum PrintStyle {
  
}

export class Proxy {
  public isBlocked: boolean = false;
  public isUserPassAuth: boolean = false;

  constructor(
      public ip: string,
      public port:string,
      public username: string = null,
      public password: string = null) {
          // Currently doesn't support an empty password,
          // not sure it that is even possible
          if (username !== null || password !== null) {
              this.isUserPassAuth = true;
          }
  }

  toString(): string {
      let stringified:string = `${this.ip}:${this.port}`;
      if (this.isUserPassAuth) {
          return `${this.username}:${this.password}@${stringified}`;
      }
      return stringified;
  }

  static parseProxy(proxyString: string): Proxy {
      try {
          let userPass: Array<string>, auth: Array<string>;
          if (proxyString.includes('@')) {
              // Has user / auth
              let split = proxyString.split('@');
              auth = split[0].split(':');
              userPass = split[1].split(':');
          } else {
              userPass = proxyString.split(':');
          }
          
          if (userPass && userPass.length < 2) {
            throw 'Bad parse';
          }
          return new Proxy(
              userPass[0],
              userPass[1],
              auth ? auth[0] : null,
              auth ? auth[1] : null
          );
      } catch (err) {
          console.log(`Proxy ${proxyString} is not able to be parsed`);
          return null;
      }
  }
}