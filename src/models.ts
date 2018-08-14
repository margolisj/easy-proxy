export interface Config {
  digital_ocean: DigitalOceanConfig;
  linode: LinodeConfig;

  provider: string;
  auth: Auth;
}

interface Auth {
  type: AuthType;
  ip?: string;
}

export enum AuthType {
  IP = 'ip',
  USERPASS = 'userpass',
  NONE = ''
}

interface DigitalOceanConfig {
  api_key: string;
  ssh_key_id: number;
  ssh_passphrase: string;
  region: string;
  rsa_id_path: string;
  tag: string;
}

interface LinodeConfig {
  apiKey: string;
  sshPassphrase: string;
  region: string;
  label: string;
}
