import jwt from 'jsonwebtoken';
import config from '../config';

export const signAccessToken = (payload: any, expiresIn: string) =>
  jwt.sign(payload, config.variables.jwtAccessSecret, {
    expiresIn,
  });

export const signRefreshToken = (payload: any, expiresIn: string) =>
  jwt.sign(payload, config.variables.jwtRefreshSecret, {
    expiresIn,
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.variables.jwtAccessSecret);
export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.variables.jwtRefreshSecret);
