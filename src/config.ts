/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';
import { version, name } from '../package.json';
import logger from './logger';

const rootPath = require.main?.path;
if (!rootPath) {
  process.exit(1);
}
dotenv.config({ path: path.join(__dirname, '../.env') });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
    PORT: Joi.number().default(3000),
    JWT_ACCESS_SECRET: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),
    PASSWORD_SALT_ROUNDS: Joi.number().default(10),
    DATABASE_URL: Joi.string().required(),
    STRIPE_SECRET_KEY: Joi.string().required(),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  logger.error(`Config validation error: ${error.message}`);
  throw new Error(`Config validation error: ${error.message}`);
}

type configType = {
  variables: {
    jwtAccessSecret: string;
    jwtRefreshSecret: string;
    passwordSaltRounds: string;
    env: string;
    port: number;
    databaseUrl: string;
    stripeSecretKey: string;
  };

  package: {
    name: string;
    version: string;
  };
};

export const config: configType = {
  variables: {
    jwtAccessSecret: envVars.JWT_ACCESS_SECRET,
    jwtRefreshSecret: envVars.JWT_REFRESH_SECRET,
    passwordSaltRounds: envVars.PASSWORD_SALT_ROUNDS,
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    databaseUrl: envVars.DATABASE_URL,
    stripeSecretKey: envVars.STRIPE_SECRET_KEY,
  },

  package: {
    name,
    version,
  },
};

export default config;
