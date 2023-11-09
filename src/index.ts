/* eslint-disable import/first */
import dotenv from 'dotenv';

dotenv.config();

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
// import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import routes from './routes/v1/routes';
import HttpException from './utils/http-exception';
import UserSwaggerDocument from '../docs/user-swagger.json';
import SellerSwaggerDocument from '../docs/seller-swagger.json';
import { version } from '../package.json';
import logRequest from './middlewares/logger.middleware';
import prisma from '../prisma/prisma-client';
import logger from './logger';

const app = express();

/**
 * App Configuration
 */

app.use(cors());

app.use(cookieParser());
app.use(
  express.json({
    verify: (req, res, buf) => {
      // @ts-ignore
      const url = req.originalUrl;
      if (url.startsWith('/v1/webhooks/payments')) {
        // @ts-ignore
        req.rawBody = buf;
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use(logRequest);
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes);

// Serves images
app.use(express.static('public'));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'API is running on /v1', version });
});
app.use(
  '/user/api-docs',
  swaggerUi.serveFiles(UserSwaggerDocument, {}),
  swaggerUi.setup(UserSwaggerDocument),
);
app.use(
  '/seller/api-docs',
  swaggerUi.serveFiles(SellerSwaggerDocument, {}),
  swaggerUi.setup(SellerSwaggerDocument),
);

app.get('/api-docs', (req: Request, res: Response) => {
  res.json({
    swagger: 'the API documentation  is now available',
  });
});

// not found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new HttpException(404, 'Not found'));
});

/* eslint-disable */
app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  if (err && err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status: 'error',
      message: 'missing authorization credentials',
    });
    // @ts-ignore
  } else if (err && err.errorCode) {
    // @ts-ignore
    res
      .status(
        // @ts-ignore
        err.errorCode,
      )
      .json({
        message: err.message,
      });
  } else if (err) {
    // if not code provided, it's a server error, so we log it and ignore message
    logger.error(`INTERNAL ERROR: ${err.message}`);
    res.status(500).json({
      message: err.message,
    });
  }
});

/**
 * Server activation
 */

const PORT = process.env.PORT || 3000;
(async () => {
  await prisma.$connect();
  logger.info('Connected to database');

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
})();
