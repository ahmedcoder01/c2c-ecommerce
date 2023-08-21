import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import validate from '../middlewares/validation.middleware';
import { productValidations } from '../validations';
import { productController } from '../controllers';
import { imageUpload } from '../lib/multer';
import logger from '../logger';

const sellerProductRouter = Router();

sellerProductRouter.post(
  '/',
  // TODO: how to handle the problem that the image is uploaded but the required validation fails?
  imageUpload.single('image'),
  // q: what will happen if the image field was not provided?
  // a:
  validate(productValidations.createProduct),
  asyncHandler(productController.createProduct),
);

sellerProductRouter.post(
  '/:productId/variants',
  // TODO: add multiple image (for now one for simplicity)
  imageUpload.single('image'),
  validate(productValidations.createProductVariant),
  asyncHandler(productController.createProductVariant),
);

sellerProductRouter.get('/', asyncHandler(productController.getProducts));
sellerProductRouter.get('/:productId', asyncHandler(productController.getProduct));

sellerProductRouter.get(
  '/:productId/variants/options',
  asyncHandler(productController.getProductVariationOptions),
);

export default sellerProductRouter;
