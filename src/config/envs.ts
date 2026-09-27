import * as joi from 'joi';
import * as dotenv from 'dotenv';
import { JwtSignOptions } from '@nestjs/jwt';

const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({
  path: [`.env.${nodeEnv}`, '.env'],
  override: true,
});

interface EnvVars {
  NODE_ENV: string;
  PORT: number;
  SWAGGER_ROUTE: string;
  SWAGGER_TITLE: string;
  SWAGGER_DESCRIPTION: string;
  SWAGGER_VERSION: string;
  SWAGGER_SERVERS: string;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
}

const envsSchema = joi
  .object({
    NODE_ENV: joi
      .string()
      .allow('development', 'production')
      .default('development'),
    PORT: joi.number().default(3000),
    SWAGGER_ROUTE: joi.string().default('/docs'),
    SWAGGER_TITLE: joi.string().default('DeployApp API'),
    SWAGGER_DESCRIPTION: joi
      .string()
      .default('DeployApp Backend API Documentation'),
    SWAGGER_VERSION: joi.string().default('1.0.0'),
    SWAGGER_SERVERS: joi.string().default('http://localhost:3000'),
    DATABASE_URL: joi.string().required(),
    JWT_ACCESS_SECRET: joi.string().required(),
    JWT_ACCESS_EXPIRES_IN: joi.string().default('15m'),
    JWT_REFRESH_SECRET: joi.string().required(),
    JWT_REFRESH_EXPIRES_IN: joi.string().default('7d'),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
}) as { error: joi.ValidationError | undefined; value: EnvVars };

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  nodeEnv: envVars.NODE_ENV,
  port: envVars.PORT,
  swaggerRoute: envVars.SWAGGER_ROUTE,
  swaggerTitle: envVars.SWAGGER_TITLE,
  swaggerDescription: envVars.SWAGGER_DESCRIPTION,
  swaggerVersion: envVars.SWAGGER_VERSION,
  swaggerServers: envVars.SWAGGER_SERVERS,
  databaseUrl: envVars.DATABASE_URL,
  jwtAccessSecret: envVars.JWT_ACCESS_SECRET,
  jwtAccessExpiresIn:
    envVars.JWT_ACCESS_EXPIRES_IN as JwtSignOptions['expiresIn'],
  jwtRefreshSecret: envVars.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn:
    envVars.JWT_REFRESH_EXPIRES_IN as JwtSignOptions['expiresIn'],
};
