import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import config from '../config';
import { ExpressHandler } from '../types';
import { signAccessToken, signRefreshToken } from '../utils/auth';

export const create: ExpressHandler<{}, {}> = async (_req, res) => {
  const data = {
    userId: 'my_user',
    email: '',
  };
  const accessToken = signAccessToken(data, '15min');
  const refreshToken = signRefreshToken(data, '7d');

  res
    .cookie('access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .sendStatus(httpStatus.OK);
};

export const refresh: ExpressHandler<{}, {}> = async (req, res) => {
  const token = req.cookies['refresh-token'];

  try {
    jwt.verify(token, config.variables.jwtRefreshSecret);
    const data = {
      userId: 'my_user',
      email: '',
    };

    const accessToken = signAccessToken(data, '15min');
    const refreshToken = signRefreshToken(data, '7d');

    res
      .cookie('access-token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      })
      .cookie('refresh-token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      })
      .sendStatus(httpStatus.OK);

    res.sendStatus(200);
  } catch {
    res.sendStatus(httpStatus.FORBIDDEN);
  }
};
