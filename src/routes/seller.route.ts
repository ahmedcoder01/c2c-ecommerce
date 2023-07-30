import { Router } from 'express';
import validate from '../middlewares/validation.middleware';
import { sellerController } from '../controllers';
import { sellerValidations } from '../validations';

const sellerRoute = Router();

sellerRoute.post(
  '/register',
  validate(sellerValidations.registerSeller),
  sellerController.postRegister,
);

sellerRoute.get('/profile', sellerController.getProfile);
sellerRoute.delete('/profile', sellerController.deleteSeller);

//* should be protected? or not?
sellerRoute.get('/:sellerId', sellerController.getSellerById);

export default sellerRoute;
