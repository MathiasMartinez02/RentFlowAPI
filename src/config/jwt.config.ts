import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES || '7d',
}));
