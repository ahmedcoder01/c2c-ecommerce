import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import config from '../config';
import { ExpressHandler } from '../types';
import { authService } from '../services';
import HttpException from '../models/http-exception.model';

interface SignupBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export const signup: ExpressHandler<SignupBody, {}> = async (req, res) => {
  await authService.checkEmailUniqueness(req.body.email);


  await authService.createUser(req.body);

  const accessToken = authService.signAccessToken(req.body.email, '15min');
  const refreshToken = authService.signRefreshToken(req.body.email, '7d');

  res
    .cookie('access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })


  return res.status(httpStatus.CREATED).json({
    message: 'User created successfully',
  });
}

export const login: ExpressHandler<LoginBody, {}> = async (req, res) => {
  const user = await authService.login(req.body);
  const accessToken = authService.signAccessToken(user.email, '15min');
  const refreshToken = authService.signRefreshToken(user.email, '7d');

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
}

export const refresh: ExpressHandler<{}, {}> = async (req, res) => {
  const token = req.cookies['refresh-token'];


  try {
    const data = jwt.verify(token, config.variables.jwtRefreshSecret)

    

    const accessToken = authService.signAccessToken(data, '15min');
    const refreshToken = authService.signRefreshToken(data, '7d');

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

    return res.sendStatus(200);
  } catch {
    throw new HttpException(httpStatus.UNAUTHORIZED, 'Invalid refresh token');
  }
};