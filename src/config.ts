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
    STRIPE_SUCCESS_URL: Joi.string().required(),
    STRIPE_CANCEL_URL: Joi.string().required(),
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
    stripeSuccessUrl: string;
    stripeCancelUrl: string;
    jwtAccessSecret: string;
    jwtRefreshSecret: string;
    passwordSaltRounds: string;
    env: string;
    port: number;
    databaseUrl: string;
    stripeSecretKey: string;
    stripeWebhooksEndpointSecret: string;
    mailAPIKey: string;
    mailDomain: string;
  };

  package: {
    name: string;
    version: string;
  };
};

export const config: configType = {
  variables: {
    stripeSuccessUrl: envVars.STRIPE_SUCCESS_URL,
    stripeCancelUrl: envVars.STRIPE_CANCEL_URL,
    jwtAccessSecret: envVars.JWT_ACCESS_SECRET,
    jwtRefreshSecret: envVars.JWT_REFRESH_SECRET,
    passwordSaltRounds: envVars.PASSWORD_SALT_ROUNDS,
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    databaseUrl: envVars.DATABASE_URL,
    stripeSecretKey: envVars.STRIPE_SECRET_KEY,
    stripeWebhooksEndpointSecret: envVars.STRIPE_WEBHOOKS_ENDPOINT_SECRET,

    mailAPIKey: envVars.MAIL_API_KEY,
    mailDomain: envVars.MAIL_DOMAIN,
  },

  package: {
    name,
    version,
  },
};

const validation = Joi.object({
  variables: Joi.object({
    stripeSuccessUrl: Joi.string().required(),
    stripeCancelUrl: Joi.string().required(),
    jwtAccessSecret: Joi.string().required(),
    jwtRefreshSecret: Joi.string().required(),
    passwordSaltRounds: Joi.number().required(),
    env: Joi.string().required(),
    port: Joi.number().required(),
    databaseUrl: Joi.string().required(),

    stripeSecretKey: Joi.string().required(),
    stripeWebhooksEndpointSecret: Joi.string().required(),

    mailAPIKey: Joi.string().required(),
    mailDomain: Joi.string().required(),
  }),
  package: Joi.object({
    name: Joi.string().required(),
    version: Joi.string().required(),
  }),
});

const { error: validationError } = validation.validate(config);

if (validationError) {
  logger.error(`Config validation error: ${validationError.message}`);
  throw new Error(`Config validation error: ${validationError.message}`);
}

export default config;
