export enum PrintStyle {
  PythonRequest,
  ColonAuth,
  AtAuth
}

export class Proxy {
  public isBlocked: boolean = false;
  public isUserPassAuth: boolean = false;

  constructor(
    public ip: string,
    public port: string,
    public username: string = null,
    public password: string = null) {
      // Currently doesn't support an empty password,
      // not sure it that is even possible
      if (username !== null || password !== null) {
          this.isUserPassAuth = true;
      }
  }

  toString(style: PrintStyle = PrintStyle.ColonAuth): string {
      // Could be a switch statement but I don't like formatting
      if (style === PrintStyle.PythonRequest) {

        let proxyAuth = this.isUserPassAuth ? `${this.username}:${this.password}@` : '';
        return `{'http': 'http://${proxyAuth}${this.ip}:${this.port}/', 'https': 'http://${proxyAuth}${this.ip}:${this.port}/'}`;

      } else if (style === PrintStyle.ColonAuth) {

        let proxyAuth = this.isUserPassAuth ? `:${this.username}:${this.password}` : '';
        return `${this.ip}:${this.port}${proxyAuth}`

      } else if (style === PrintStyle.AtAuth) {
        
        let proxyAuth = this.isUserPassAuth ? `${this.username}:${this.password}@` : '';
        return `${proxyAuth}${this.ip}:${this.port}`

      }
  }

  static parseProxy(proxyString: string): Proxy {
    try {
      let userPass: Array<string>, auth: Array<string>;

      if (proxyString.includes('@')) { // Parse @ auth
        let split = proxyString.split('@');
        auth = split[0].split(':');
        userPass = split[1].split(':');
      } else if (proxyString.split(':').length > 3) { // Parse 4 colon
        let split = proxyString.split(':');
        userPass = [split[0], split[1]];
        auth = [split[2], split[3]];
      } else { // Parse no user / password auth
        userPass = proxyString.split(':');
      }
      
      if (userPass && userPass.length < 2) {
        throw 'Unable to parse';
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