import { loadConfig } from './config';
import { propmtPromise,} from './utils';
import { Provider } from './providers/interfaces';
import { DigitalOceanProvider } from './providers/digitalOcean';
import { LinodeProvider } from './providers/linode';

let main = async () => {
  const config = loadConfig();

  try {
    let provider: Provider;
    if (config.provider === 'digital_ocean') {
      provider = new DigitalOceanProvider(config);
    } else if (config.provider === 'linode'){
      provider = new LinodeProvider(config);
    } else {
      throw new Error('Unable to determine provider');
    }

    console.log(`
      Creating proxies on ${config.provider}:
      region: ${config[config.provider]['region']}
      auth: ${config.auth.type}
    `);

    let result = await propmtPromise([{
      name: 'count',
      required: true,
      description: 'Number of proxies to make'
    }]);

    let proxyCount = parseInt(result['count']);
    console.log(`Creating proxies | ${proxyCount}`);

    let createPromises = Array.from(Array(proxyCount))
      .map(async () =>  await provider.makeInstance());

    let createdProxies = await Promise.all(createPromises);
    console.log(createdProxies);
    createdProxies.forEach(proxy => console.log(proxy.toString()))
  } catch (err) {
    console.log(err);
  }

  console.log('Completed');
};

main();
