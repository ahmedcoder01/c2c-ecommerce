import httpStatus from 'http-status';
import { ExpressHandler } from '../types';
import { verifyAccessToken } from '../services/auth.service';
import { sellerService } from '../services';
import HttpException from '../utils/http-exception';

// eslint-disable-next-line import/prefer-default-export, consistent-return
export const requireAuth: ExpressHandler<{}, {}> = async (req, res, next) => {
  const token = req.cookies['access-token'];
  if (!token) {
    return res.sendStatus(httpStatus.UNAUTHORIZED);
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
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
};

// eslint-disable-next-line consistent-return
export const requireSellerProfile: ExpressHandler<{}, {}> = async (req, res, next) => {
  if (!res.locals.userId) {
    return res.sendStatus(httpStatus.FORBIDDEN);
  }

  const { userId, email } = res.locals;

  const seller = await sellerService.getOrThrow(userId);

  res.locals.sellerId = seller.id;

  next();
};
