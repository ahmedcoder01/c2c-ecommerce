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

//! TEMP JUST UNTIL WE HAVE WEBHOOKS
orderRoute.post(
  '/orders/:orderId/confirm',
  requireAuth,
  validate(orderValidations.confirmOrder),
  asyncHandler(orderController.confirmOrder),
);

orderRoute.get('/orders', requireAuth, asyncHandler(orderController.listUserOrders));

export default orderRoute;
