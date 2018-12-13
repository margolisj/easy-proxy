import { Proxy, PrintStyle } from "./proxy";
import * as rp from 'request-promise-native';

interface Site {
  name: string,
  url: string;
  test(html:string): boolean;
};

// const nikeSnkrs: Site = {
//   name: 'Snkrs Api',
//   url: 'https://api.nike.com/',
//   test: (html) => {
//     return true;
//   }
// };

const supreme: Site = {
  name: 'Supreme',
  url: 'https://supremenewyork.com',
  test: (html) => true
};

const google: Site = {
  name: 'Google',
  url: 'https://google.com',
  test: (html) => true
};

const footpatrol: Site = {
  name: 'Footpatrol',
  url: 'https://www.footpatrol.com/',
  test: (html) => true
};

const footaction: Site = {
  name: 'Footaction',
  url: 'https://www.footlocker.com/',
  test: (html) => true
};

const footlocker: Site = {
  name: 'Footlocker',
  url: 'https://www.footlocker.com/',
  test: (html) => true
};

const champs: Site = {
  name: 'Champs',
  url: 'https://www.champssports.com/',
  test: (html) => true
};

const finishline: Site = {
  name: 'FinishLine',
  url: 'https://www.finishline.com/',
  test: (html) => true
};

const yeezysupply: Site = {
  name: 'YeezySupply',
  url: 'https://yeezysupply.com/',
  test: (html) => true
};

const proxies: Array<Proxy> = [
  '142.93.184.221:4710',
].map(p => Proxy.parseProxy(p));


//https://teamswish.com

let main = async () => {
  // let failed: Array<Proxy> = [];
  // let success: Array<Proxy> = [];
  let testSites: Array<Site> = [
    supreme,
    // google,
    footpatrol,
    footaction,
    footlocker,
    champs,
    finishline,
    yeezysupply
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