import http from 'http';
import dotenv from 'dotenv';
import express from 'express';
import prisma from '../prisma/prisma-client';
import logger from './logger';
import { App } from './App';

dotenv.config();

/**
 * Server activation
 */

const PORT = process.env.PORT || 3000;
(async () => {
  logger.info('Connected to database');
  const app = new App();
  await app.init();
  const e = app.getApp();
  const server = http.createServer(e);
  app.bindSocketIO(server);

  server.listen(PORT, async () => {
    logger.info(`Server is running on port ${PORT}`);
    app.onServerStart();
  });
})();
