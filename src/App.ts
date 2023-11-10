import express, { Express, NextFunction, Request, Response } from 'express';
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
import logger from './logger';
import prisma from '../prisma/prisma-client';
import auctionsManager from './events/Auctions.event';

export class App {
  public app: Express;

  private ready: boolean;

  constructor() {
    this.app = express();
    this.ready = false;
  }

  public async init() {
    this.registerRoutes();
    await prisma.$connect();
    this.ready = true;

    return this;
  }

  public getApp() {
    if (!this.ready) {
      throw new Error('App not ready');
    }
    return this.app;
  }

  private registerRoutes() {
    /**
     * App Configuration
     */

    this.app.use(cors());

    this.app.use(cookieParser());
    this.app.use(
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
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use(logRequest);
    // this.app.use(bodyParser.json());
    // this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(routes);

    // Serves images
    this.app.use(express.static('public'));

    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'API is running on /v1', version });
    });
    this.app.use(
      '/user/api-docs',
      swaggerUi.serveFiles(UserSwaggerDocument, {}),
      swaggerUi.setup(UserSwaggerDocument),
    );
    this.app.use(
      '/seller/api-docs',
      swaggerUi.serveFiles(SellerSwaggerDocument, {}),
      swaggerUi.setup(SellerSwaggerDocument),
    );

    this.app.get('/api-docs', (req: Request, res: Response) => {
      res.json({
        swagger: 'the API documentation  is now available',
      });
    });

    // not found handler
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      next(new HttpException(404, 'Not found'));
    });

    /* eslint-disable */
    this.app.use((err: Error | HttpException, req: Request, res: Response, next: NextFunction) => {
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
  }

  public async onServerStart() {
    await auctionsManager.replayRegisteredAuctions();
  }
}
