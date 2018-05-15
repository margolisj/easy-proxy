export interface Config {
  digital_ocean: DigitalOceanConfig;
  linode: LinodeConfig;

  provider: string;
  auth: boolean;
}

interface DigitalOceanConfig {
  api_key: string;
  ssh_key_id: number;
  ssh_passphrase: string;
  region: string;
  rsa_id_path: string;
}

interface LinodeConfig {
  apiKey: string;
  sshPassphrase: string;
  region: string;
}
