import * as prompt from 'prompt';
import * as randomstring from 'randomstring';

// curl -x http://${proxy.IP}:${proxy.Port} --proxy-user ${proxy.Username}:${proxy.Password} -L http://www.supremenewyork.com/mobile_stock.json -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 11_0_3 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Mobile/15A432"

export const printProxiesAdidas = (createdProxies) => {
  createdProxies.forEach(proxy => {
    console.log(`
    {
      ip_port: '${proxy.IP}:${proxy.Port}',
      user: '${proxy.Username}',
      pass: '${proxy.Password}'
    },`);
  });
};

export const delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const propmtPromise = (settings: [any]) => {
  return new Promise((res, rej) => {
    prompt.get(settings, (err, results) => {
      if (err) {
        rej(err);
      }
      res(results);
    });
  });
}

export const getRandomProxyData = () => {
  let port = Math.floor(Math.random() * 6500) + 2000;

  let username = randomstring.generate({
    length: 7,
    charset: 'alphabetic',
    capitalization: 'lowercase'
  });

  let password = randomstring.generate({
    length: 14,
    charset: 'alphabetic',
    capitalization: 'lowercase'
  });

  return {
      proxyUsername: username,
      proxyPassword: password,
      port: port
  };
};
