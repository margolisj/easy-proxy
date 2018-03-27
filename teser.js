let rp = require('request-promise');

let url = 'http://www.adidas.com/yeezy';
let proxies = [

];

let main = () => {

  proxies.forEach((proxy) => {
    let host = proxy.split(':')[0],
        port = proxy.split(':')[1];

    rp.get({
      url: url,
      agentOptions: {
        socksHost: host, // Defaults to 'localhost'.
        socksPort: port // Defaults to 1080.
      }
    }).then(() => {
      console.log(`success for ${proxy}`);
    }).error((err) => {
      console.log(err);
    });
  });

};

main();