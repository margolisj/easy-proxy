let rp = require('request-promise');

let url = 'http://www.adidas.com/yeezy';
let proxies = [
  '104.236.60.95:3128',
  '104.131.108.83:3128',
  '104.236.60.44:3128',
  '104.236.59.232:3128',
  '104.236.59.210:3128',
  '104.236.60.28:3128',
  '104.131.42.249:3128',
  '104.236.59.181:3128',
  '104.236.59.185:3128',
  '104.236.60.61:3128',
];

let main = () => {

  proxies.forEach((proxy) => {
    let host = proxy.split(':')[0],
        port = proxy.split(':')[1];

    rp.get({
      url: url,
      // agentOptions: {
      //   socksHost: host, // Defaults to 'localhost'.
      //   socksPort: port // Defaults to 1080.
      // }
    }).then(() => {
      console.log(`success for ${proxy}`);
    }).error((err) => {
      console.log(err);
    });
  });

};

main();