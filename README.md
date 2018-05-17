# easy-proxy
Creates proxies on hosts

## Todo
* Features
  * Update example config
  * Finish tester
    * Figure out why some aren't working
    * Sites
      * Shopfy / Kith
      * Footsites
  * Test tagging with DO from config
  * Add google aka GCE
* Errors
  * Linode - Figure out 408 - {"errors":[{"reason":"Please try again"}]} - on create node
  * DO and Linode: Error: Timed out while waiting for handshake - on ssh connection
* Longterm
  * IP Auth squid config

## Installation

### Setup:

Configure information inside the `config.example.json` be sure to rename it to `config.json` or simply run `mv config.example.json config.json` (macOS & Windows) when you're done.

Example curl with auth:

```
$  curl -x http://104.236.214.154:3128/ --proxy-user vrztdnh:xjerkurbgnqzvl -L supremenewyork.com
```

Example curl without auth:

```
$  curl -x http://104.236.214.154:3128/ -L supremenewyork.com
```

### Config

* **config**{ Object }:
  * **config.provider** {  _String_ }: Provider used to create proxies as of right now only `digital_ocean` is an option.
  * **config.auth** {  _Boolean_ }: To use user auth

  * **config.digital_ocean.api_key** {  _String_ }: DigitalOcean API Key
  * **config.digital_ocean.ssh_key_id** {  _Number_ }: SSH keys that you wish to embed into your server, you must add your SSH Key to your DigitalOcean account and collect the ID. If you are unsure of the ID associated with your SSH Key you can simply run `node scripts/ssh_keys` to find the ID attached to your key.
  * **config.digital_ocean.rsa_id_path** {  _String_ }: The path to your RSA private key, this may vary depending on what operating system you're on by default if you're using `ssh-keygen -t rsa` to generate RSA keys on macOS or Linux then your RSA private key path should look like this `/Users/john/.ssh/id_rsa` or `/home/john/.ssh/id_rsa`. But if you're on Windows, assuming that you're using PuTTYgen to generate your private/public key then you know where the location of you're private key is (usually with the file extension `.ppk`) under the `rsa_id_path` field on Windows yours should look like this `C:\\Users\\Billy\\Documents\\ssh-private.ppk` depending on where you saved your private key.
  * **config.digital_ocean.ssh_passphrase** {  _String_ }: If you did not set a passphrase to your SSH key then you can set this value as `null` otherwise you should set this value to the passphrase if present.
  * **config.digital_ocean.region** {  _String_ }: Desired location to deploy proxies.

  * **config.linode.apiKey** {  _String_ }: Linode API Key.
  * **config.linode.sshPassphrase** {  _String_ }: Password to use as root on all boxes.
  * **config.linode.region** {  _String_ }: Desired location to deploy proxies.


## Useful Documentation
* Digital Ocean
** https://github.com/matt-major-zz/do-wrapper/blob/master/docs/do-wrapper.md
** https://developers.digitalocean.com/documentation/v2/#create-a-new-droplet
* Node
** https://github.com/steelbrain/node-ssh
** request-native proxy: https://github.com/request/request-promise/issues/130


## Old Config Links
* https://gist.githubusercontent.com/margolisj/ff35ff91df747e5917174d7cca0cf769/raw/4f7296169a9b081998103fdedb41cc2e9281c648/conf'
* https://gist.githubusercontent.com/margolisj/8b2cfd84f8ad7d3ddf1743c8046fe680/raw/7a57321da876cca76ae8e19e76fdf1264aad6cf9/squid_conf_with_auth.conf'
