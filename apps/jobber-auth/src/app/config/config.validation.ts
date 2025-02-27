import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  PORT: Joi.number(),
  AUTH_DATABASE_URL: Joi.string().required(),
  PULSAR_URL: Joi.string().required(),
  PULSAR_ADMIN_URL: Joi.string().required(),
  PULSAR_TENANT: Joi.string().required(),
  PULSAR_NAMESPACE: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
});
