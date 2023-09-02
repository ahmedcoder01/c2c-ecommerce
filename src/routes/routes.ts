import express, { Router } from 'express';
import authRouter from './auth.route';
import sellerRouter from './seller.route';
import { requireAuth, requireSellerProfile } from '../middlewares/auth.middleware';
import sellerProductRouter from './product.seller.route';
import uploadRoute from './upload.route';

const api = Router();

api.use('/auth', authRouter);
api.use('/sellers/products', [requireAuth, requireSellerProfile], sellerProductRouter);
api.use('/sellers', sellerRouter);
api.use('/media', uploadRoute);

// Serve static images
api.use('/uploads/images', express.static('uploads/images'));

export default Router().use('/v1', api);
