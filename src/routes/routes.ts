import express, { Router } from 'express';
import authRouter from './auth.route';
import sellerProfileRouter from './seller/profile.seller.route';
import { requireAuth, requireSellerProfile } from '../middlewares/auth.middleware';
import sellerProductRouter from './seller/product.seller.route';
import uploadRoute from './seller/upload.seller.route';
import cartRouter from './cart.route';
import orderRouter from './order.route';
import sellerOrdersRouter from './seller/order.seller.route';
import paymentsWebhooks from './payment-webhook.route';

const api = Router();

api.use('/auth', express.json(), authRouter);
api.use('/', express.json(), cartRouter);
api.use('/', express.json(), orderRouter);

//  SELLER SPECIFIC ROUTES
api.use(
  '/sellers/products',
  express.json(),
  [requireAuth, requireSellerProfile],
  sellerProductRouter,
);
api.use('/sellers/profiles', express.json(), sellerProfileRouter);
api.use('/sellers/orders', express.json(), requireAuth, requireSellerProfile, sellerOrdersRouter);
api.use('/sellers/media', express.json(), uploadRoute);

api.use('/', paymentsWebhooks);

// Serve static images
api.use('/uploads/images', express.static('uploads/images'));

export default Router().use('/v1', api);
