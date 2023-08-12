import { Router } from 'express';
import authRouter from './auth.route';
import sellerRouter from './seller.route';
import { requireAuth, requireSellerProfile } from '../middlewares/auth.middleware';
import sellerProductRouter from './product.seller.route';

const api = Router();

api.use('/auth', authRouter);
api.use('/sellers', sellerRouter);
api.use('/sellers/products', [requireAuth, requireSellerProfile], sellerProductRouter);

export default Router().use('/v1', api);
