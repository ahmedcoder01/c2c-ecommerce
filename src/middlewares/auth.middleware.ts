import httpStatus from 'http-status';
import asyncHandler from 'express-async-handler';
import cookie from 'cookie';
import { ExpressHandler } from '../types';
import { verifyAccessToken } from '../services/auth.service';
import { sellerService } from '../services';
import HttpException from '../utils/http-exception';

// eslint-disable-next-line import/prefer-default-export, consistent-return
export const requireAuth: ExpressHandler<{}, {}> = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.['access-token'] ||
    // @ts-ignore // TEMP: for socket io adapter
    cookie.parse(req.handshake?.headers?.cookie ?? '')?.['access-token'];

  if (!token) {
    // return res.sendStatus(httpStatus.UNAUTHORIZED);
    return next(new HttpException(httpStatus.UNAUTHORIZED, httpStatus[httpStatus.UNAUTHORIZED]));
  }

  try {
    // @ts-ignore
    const data: {
      userId: number;
      email: string;
    } = verifyAccessToken(token);

    req.userId = data.userId;
    req.email = data.email;
    next();
  } catch {
    return next(new HttpException(httpStatus.UNAUTHORIZED, httpStatus[httpStatus.UNAUTHORIZED]));
  }
});

// eslint-disable-next-line consistent-return
export const requireSellerProfile: ExpressHandler<{}, {}> = asyncHandler(async (req, res, next) => {
  if (!req.userId) {
    return next(new HttpException(httpStatus.FORBIDDEN, httpStatus[httpStatus.FORBIDDEN]));
  }

  const { userId, email } = req;

  const seller = await sellerService.getOrThrow(userId);

  req.sellerId = seller.id;

  next();
});
