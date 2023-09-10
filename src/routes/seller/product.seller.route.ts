import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import Joi from 'joi';
import validate from '../../middlewares/validation.middleware';
import { productValidations } from '../../validations';
import { productController } from '../../controllers';
import { anyFileUpload } from '../../lib/multer';
import logger from '../../logger';

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

sellerProductRouter.get('/', asyncHandler(productController.getSellerProducts));
sellerProductRouter.get(
  '/:productId',
  validate(productValidations.getProduct),
  asyncHandler(productController.getProduct),
);

sellerProductRouter.get(
  '/:productId/variants/options',
  validate(productValidations.productGet),
  asyncHandler(productController.getProductVariationOptions),
);

sellerProductRouter.get(
  '/:productId/variants/:variantId',
  validate(productValidations.variantGet),
  asyncHandler(productController.getProductVariant),
);

sellerProductRouter.delete(
  '/:productId',
  validate(productValidations.productGet),
  asyncHandler(productController.deleteProduct),
);

sellerProductRouter.delete(
  '/:productId/variants/:variantId',
  validate(productValidations.variantGet),
  asyncHandler(productController.deleteProductVariant),
);

sellerProductRouter.put(
  '/:productId',
  validate(productValidations.updateProduct),
  asyncHandler(productController.updateProduct),
);

sellerProductRouter.put(
  '/:productId/variants/:variantId',
  validate(productValidations.updateProductVariant),
  asyncHandler(productController.updateProductVariant),
);

export default sellerProductRouter;
