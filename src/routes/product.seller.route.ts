import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import validate from '../middlewares/validation.middleware';
import { productValidations } from '../validations';
import { productController } from '../controllers';

const sellerProductRouter = Router();

sellerProductRouter.post(
  '/',
  validate(productValidations.createProduct),
  asyncHandler(productController.createProduct),
);

sellerProductRouter.post(
  '/:productId/variants',
  validate(productValidations.createProductVariant),
  asyncHandler(productController.createProductVariant),
);

sellerProductRouter.get('/:productId', asyncHandler(productController.getProduct));

sellerProductRouter.get(
  '/:productId/variants/options',
  asyncHandler(productController.getProductVariationOptions),
);

// get

export default sellerProductRouter;
