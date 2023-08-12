import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import validate from '../middlewares/validation.middleware';
import { sellerController } from '../controllers';
import { sellerValidations } from '../validations';
import { requireAuth } from '../middlewares/auth.middleware';

const sellerRoute = Router();

sellerRoute.post(
  '/register',
  validate(sellerValidations.registerSeller),
  requireAuth,
  asyncHandler(sellerController.postRegister),
);

sellerRoute.get('/profile', requireAuth, asyncHandler(sellerController.getProfile));
sellerRoute.delete('/profile', requireAuth, asyncHandler(sellerController.deleteSeller));

//* should be protected? or not? For now, it's not protected
sellerRoute.get('/:sellerId', asyncHandler(sellerController.getSellerById));

export default sellerRoute;
