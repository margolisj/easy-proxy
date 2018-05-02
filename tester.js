let rp = require('request-promise-native');

let url = 'http://www.nike.com/launch/';

let proxies = [

];

let main = async () => {

  await Promise.all(proxies.map(async (proxy) => {
    let host = proxy.split(':')[0],
        port = proxy.split(':')[1];

    console.log(`Testing ${proxy}`);
    try {
      let response = await rp.get({
        url: url,
        time: true,
        proxy: `http://${proxy}`,
        timeout: 20 * 1000, // Input in ms
        gzip: true,
        resolveWithFullResponse: true,
        headers: {
          // "host": "0.0.0.0:8080",
          "connection": "keep-alive",
          "user-agent": "Mozilla/5.0 (X11; Linux i686) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.63 Safari/535.7",
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-encoding": "gzip",
          "accept-language": "en-US,en;q=0.8",
          "accept-charset": "ISO-8859-1,utf-8;q=0.7,*;q=0.3"
        }
      });
      console.log(response.timingPhases);
      // console.log('success ' + proxy);

    } catch (err) {
      console.log('failed ' + proxy);
      console.log(err);
    }

  }));

};

main();