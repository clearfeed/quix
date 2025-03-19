import { BaseConfig } from "@clearfeed-ai/quix-common-agent";

export interface PostgresConfig extends BaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
}