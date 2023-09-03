import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import validate from '../middlewares/validation.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { orderController } from '../controllers';
import { orderValidations } from '../validations';

const orderRoute = Router();

orderRoute.post(
  '/checkout',
  requireAuth,
  validate(orderValidations.createCheckoutSession),
  asyncHandler(orderController.createOrderFromCart),
);

export default orderRoute;
