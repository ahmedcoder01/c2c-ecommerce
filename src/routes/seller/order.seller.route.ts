import asyncHandler from 'express-async-handler';
import { Router } from 'express';
import Joi from 'joi';
import validate from '../../middlewares/validation.middleware';
import { sellerOrdersController } from '../../controllers';
import { anyFileUpload } from '../../lib/multer';
import logger from '../../logger';

const sellerOrdersRouter = Router();

sellerOrdersRouter.get('/', asyncHandler(sellerOrdersController.getSellerOrders));

export default sellerOrdersRouter;
