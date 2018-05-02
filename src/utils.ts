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
