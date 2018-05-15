import { Proxy, PrintStyle } from "./proxy";
let rp = require('request-promise-native');

interface Site {
  name: string,
  url: string;
  test(html:string): boolean;
};

let nikeSnkrs: Site = {
  name: 'Snkrs Api',
  url: 'https://api.nike.com/',
  test: (html) => {
    return true;
  }
};

let supreme: Site = {
  name: 'Supreme',
  url: 'http://supremenewyork.com',
  test: (html) => true
};

let google: Site = {
  name: 'Google',
  url: 'http://google.com',
  test: (html) => true
};

let proxies: Array<Proxy> = [
  // '174.138.49.206:6138:juhlaeu:vqekbcvjhwnngh', // DO
  '139.162.237.157:3538:fpitfqa:jmxwztpzcgqrny', //Linode
  // '109.74.199.143:6132', //Linode
].map(p => Proxy.parseProxy(p));

let main = async () => {

  // let failed: Array<Proxy> = [];
  // let success: Array<Proxy> = [];
  let testSites: Array<Site> = [
    nikeSnkrs,
    supreme,
    google
  ];

  // let results: Map<string, Array<any>> = new Map();
  // proxies.forEach(p => results[p.toString()] = []);
  
  await Promise.all(proxies.map(async (proxy) => {
    testSites.forEach(async (s) => {

      console.log(`Testing ${proxy.toString()} on site ${s.url}`);
      try {
        let response = await rp.get({
          url: s.url,
          time: true,
          proxy: `http://${proxy.toString(PrintStyle.AtAuth)}`,
          timeout: 20 * 1000, // Input in ms
          gzip: true,
          resolveWithFullResponse: true,
          headers: {
            "connection": "keep-alive",
            "user-agent": "Mozilla/5.0 (X11; Linux i686) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.63 Safari/535.7",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            // "accept-encoding": "gzip",
            "accept-language": "en-US,en;q=0.8",
            "accept-charset": "utf-8;q=0.7,*;q=0.3"
          }
        });
        // console.log(response.timingPhases);
        console.log('Success ' + proxy.toString(PrintStyle.AtAuth) + ' ' + s.url);
        // results[proxy.toString()].push(s.name);
      } catch (err) {
        console.log('Failed ' + proxy.toString(PrintStyle.AtAuth) + ' ' + s.url);
        // console.log(err);
      }
    })
  }));

};

main();