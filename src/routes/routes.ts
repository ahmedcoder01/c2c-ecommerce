import { Router } from 'express';
import authRouter from './auth.route';
import sellerRouter from './seller.route';
import { requireAuth } from '../middlewares/auth.middleware';

const api = Router();

api.use('/auth', authRouter);
api.use('/sellers', requireAuth, sellerRouter);

export default Router().use('/v1', api);
