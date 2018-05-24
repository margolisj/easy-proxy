import * as prompt from 'prompt';
import * as randomstring from 'randomstring';

export const groupBy = (xs, key) => {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
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
      port: port + '' // Convert to string
  };
};
