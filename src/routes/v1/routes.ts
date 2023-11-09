import express, { Router } from 'express';
import authRouter from './auth.route';
import sellerProfileRouter from './seller/profile.seller.route';
import { requireAuth, requireSellerProfile } from '../../middlewares/auth.middleware';
import sellerProductRouter from './seller/product.seller.route';
import uploadRoute from './seller/upload.seller.route';
import cartRouter from './cart.route';
import orderRouter from './order.route';
import sellerOrdersRouter from './seller/order.seller.route';
import paymentsWebhooks from './payment-webhook.route';
import shippingAdressesRouter from './shipping-address.route';

const api = Router();

api.use('/auth', authRouter);
api.use('/', cartRouter);
api.use('/', orderRouter);
api.use('/', shippingAdressesRouter);

//  SELLER SPECIFIC ROUTES
api.use('/sellers/products', [requireAuth, requireSellerProfile], sellerProductRouter);
api.use('/sellers/profiles', sellerProfileRouter);
api.use('/sellers/orders', requireAuth, requireSellerProfile, sellerOrdersRouter);
api.use('/sellers/media', uploadRoute);

api.use('/', paymentsWebhooks);

// Serve static images
api.use('/uploads/images', express.static('uploads/images'));

export default Router().use('/v1', api);
