export interface Config {
  digital_ocean: DigitalOceanConfig;
  linode: LinodeConfig;
  docker: DockerContainerConfig;

  provider: string;
  auth: boolean;
}

interface DigitalOceanConfig {
  api_key: string;
  instance_size: string;
  ssh_key_ids: [number];
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

interface DockerContainerConfig {
  download_url: string;
  worker_port: number;
  vnc_web_ui_port: number;
  vnc_port: number;
}
