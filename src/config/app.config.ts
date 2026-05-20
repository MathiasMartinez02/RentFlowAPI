import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
  logLevel: process.env.LOG_LEVEL || 'debug',
}));
