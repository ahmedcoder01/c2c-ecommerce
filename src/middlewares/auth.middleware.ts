import httpStatus from 'http-status';
import { ExpressHandler } from '../types';
import { verifyAccessToken } from '../utils/auth';

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
