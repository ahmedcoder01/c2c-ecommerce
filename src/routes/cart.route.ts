import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import validate from '../middlewares/validation.middleware';
import { authValidations, cartValidations } from '../validations';
import { requireAuth } from '../middlewares/auth.middleware';
import { cartController } from '../controllers';

const cartRouter = Router();

cartRouter.post(
  '/cart/add',
  requireAuth,
  validate(cartValidations.addProductToCart),
  asyncHandler(cartController.addProductToCart),
);

cartRouter.get('/cart', requireAuth, asyncHandler(cartController.getCartByUserId));

cartRouter.delete(
  '/cart/:cartItemId',
  requireAuth,
  asyncHandler(cartController.removeProductFromCart),
);

export default cartRouter;
