import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import validate from '../middlewares/validation.middleware';
import { productValidations } from '../validations';
import { productController } from '../controllers';

const sellerProductRouter = Router();

sellerProductRouter.post(
  '/create',
  validate(productValidations.createProduct),
  asyncHandler(productController.createProduct),
);

sellerProductRouter.post(
  '/variants/create',
  validate(productValidations.createProductVariant),
  asyncHandler(productController.createProductVariant),
);

export default sellerProductRouter;
