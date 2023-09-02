import { NextFunction, Request, Response } from 'express';
import logger from '../logger';

const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const { method, originalUrl, body, query, params, cookies } = req;

  const log = {
    method,
    originalUrl,
    body,
    query,
    params,
    cookies,
  };

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  logger.info(`Method: ${method} - URL: ${originalUrl}. IP: ${ip}`);

  return next();
};

export default logRequest;
