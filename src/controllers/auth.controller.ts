import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { User, SellerProfile } from '@prisma/client';
import config from '../config';
import { ExpressHandler } from '../types';
import { authService } from '../services';
import HttpException from '../utils/http-exception';
import { UpdatedJwtPayload } from '../types/jwt.type';

interface SignupBody {
  email: string;
  password: string;
  name: string;
}

interface LoginBody {
  email: string;
  password: string;
}

type AuthResponse = {
  user: Pick<User, 'email' | 'id' | 'name'> & {
    sellerProfile: SellerProfile;
  };
};

export const signup: ExpressHandler<SignupBody, AuthResponse> = async (req, res) => {
  await authService.checkEmailUniqueness(req.body.email);

  const user = await authService.createUser(req.body);

  const jwtPayload = {
    email: user.email,
    userId: user.id,
  };

  const accessToken = authService.signAccessToken(jwtPayload, '4h');
  const refreshToken = authService.signRefreshToken(jwtPayload, '7d');

  res
    .cookie('access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

  return res.status(httpStatus.CREATED).json({
    message: 'User created successfully',
    user: {
      ...user,
      sellerProfile: user.sellerProfile!,
    },
  });
};

export const login: ExpressHandler<LoginBody, AuthResponse> = async (req, res) => {
  const user = await authService.login(req.body);
  const jwtPayload = {
    email: user.email,
    userId: user.id,
  };
  const accessToken = authService.signAccessToken(jwtPayload, '4h');
  const refreshToken = authService.signRefreshToken(jwtPayload, '7d');

  res
    .cookie('access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .status(httpStatus.OK)
    .json({
      user: {
        ...user,
        sellerProfile: user.sellerProfile!,
      },
    });
};

export const refresh: ExpressHandler<{}, {}> = async (req, res) => {
  const token = req.cookies['refresh-token'];

  let data;
  try {
    data = jwt.verify(token, config.variables.jwtRefreshSecret) as UpdatedJwtPayload;
  } catch (err) {
    throw new HttpException(httpStatus.UNAUTHORIZED, 'Unauthorized');
  }

  // check if user exists
  try {
    await authService.checkUserExistsByIdOrThrow(data.userId);
  } catch (err) {
    res.clearCookie('access-token').clearCookie('refresh-token');
    throw err;
  }

  const jwtPayload = {
    email: data.email,
    userId: data.userId,
  };

  const accessToken = authService.signAccessToken(jwtPayload, '4h');
  const refreshToken = authService.signRefreshToken(jwtPayload, '7d');

  res
    .cookie('access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .cookie('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

  return res.sendStatus(200);
};

export const logout: ExpressHandler<{}, {}> = async (req, res) => {
  res.clearCookie('access-token').clearCookie('refresh-token').sendStatus(httpStatus.OK);
};

export const me: ExpressHandler<{}, AuthResponse> = async (req, res) => {
  const accessToken = req.cookies['access-token'];

  let data;

  try {
    data = jwt.verify(accessToken, config.variables.jwtAccessSecret) as UpdatedJwtPayload;
  } catch {
    throw new HttpException(httpStatus.UNAUTHORIZED, 'Unauthorized');
  }

  const user = await authService.getUserInfo(data.email);

  return res.status(httpStatus.OK).json({
    user: {
      ...user,
      sellerProfile: user.sellerProfile!,
    },
  });
};
