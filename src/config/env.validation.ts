import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  ACCESS_TOKEN_EXPIRES: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRES: Joi.string().default('7d'),

  SWAGGER_ENABLED: Joi.boolean().default(true),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('debug'),
  FRONTEND_URL: Joi.string().optional().default('*'),

  MYSQL_ROOT_PASSWORD: Joi.string().optional(),
  MYSQL_USER: Joi.string().optional(),
  MYSQL_PASSWORD: Joi.string().optional(),
  MYSQL_DB: Joi.string().optional(),
  MYSQL_PORT: Joi.number().optional(),
  ADMINER_PORT: Joi.number().optional(),
});
