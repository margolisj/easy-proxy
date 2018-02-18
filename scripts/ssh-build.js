const SSH = require('simple-ssh');
const config = require('../config');
const fs = require('fs');

let host = '104.131.184.252';
let username = 'wqjvkbm';
let password = 'hsntckzhwzbons';

/* 
  Runs the ssh commands against. Useful if the host doesn't take to the original
  ssh comands issued to it.
 */

let ssh = new SSH({
  host: host,
  user: 'root',
  key: fs.readFileSync(config.digital_ocean.rsa_id_path.replace(/(\s)/, "\\ ")),
  passphrase: config.digital_ocean.ssh_passphrase
});

let proxySetup = (username, password) => {
  return new Promise((resolve, reject) => {

    let ssh = new SSH({
      host: host,
      user: 'root',
      key: fs.readFileSync(config.digital_ocean.rsa_id_path.replace(/(\s)/, "\\ ")),
      passphrase: config.digital_ocean.ssh_passphrase
    });

    ssh.exec(
      `yum install squid httpd-tools wget -y &&
      touch /etc/squid/passwd &&
      htpasswd -b /etc/squid/passwd ${username} ${password} &&
      wget -O /etc/squid/squid.conf https://raw.githubusercontent.com/dzt/easy-proxy/master/confg/squid.conf --no-check-certificate &&
      touch /etc/squid/blacklist.acl &&
      systemctl restart squid.service && systemctl enable squid.service &&
      iptables -I INPUT -p tcp --dport 3128 -j ACCEPT &&
      iptables-save`, {
        err: function(stderr) {
          console.log(stderr);
        },
        out: function(stdout) {
          console.log(stdout);
        },
        exit: (code, stdout, stderr) => console.log(`${code} ${stdout} ${stderr}`)
      }).start({
        success: _ => {
          console.log(`Successfully execueting code on server ${host}`);
          resolve({
            'IP': host,
            'Port': '3128',
            'Username': username,
            'Password': password
          });
        },
        fail: (err) => {
          console.log(`Unable to execueted code on server ${host}`)
          reject(err);
        }
    });
  });
};

console.log(proxySetup(username, password));