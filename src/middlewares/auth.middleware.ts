import httpStatus from 'http-status';
import asyncHandler from 'express-async-handler';
import { ExpressHandler } from '../types';
import { verifyAccessToken } from '../services/auth.service';
import { sellerService } from '../services';
import HttpException from '../utils/http-exception';

// eslint-disable-next-line import/prefer-default-export, consistent-return
export const requireAuth: ExpressHandler<{}, {}> = asyncHandler(async (req, res, next) => {
  const token = req.cookies['access-token'];
  if (!token) {
    // return res.sendStatus(httpStatus.UNAUTHORIZED);
    return next(new HttpException(httpStatus.UNAUTHORIZED, httpStatus[httpStatus.UNAUTHORIZED]));
  }

  try {
    // @ts-ignore
    const data: {
      userId: string;
      email: string;
    } = verifyAccessToken(token);

    res.locals.userId = data.userId;
    res.locals.email = data.email;
    next();
  } catch {
    // return res.sendStatus(httpStatus.FORBIDDEN);
    return next(new HttpException(httpStatus.FORBIDDEN, httpStatus[httpStatus.FORBIDDEN]));
  }
});

// eslint-disable-next-line consistent-return
export const requireSellerProfile: ExpressHandler<{}, {}> = asyncHandler(async (req, res, next) => {
  if (!res.locals.userId) {
    return next(new HttpException(httpStatus.FORBIDDEN, httpStatus[httpStatus.FORBIDDEN]));
  }

  const { userId, email } = res.locals;

  const seller = await sellerService.getOrThrow(userId);

  res.locals.sellerId = seller.id;

  next();
});
