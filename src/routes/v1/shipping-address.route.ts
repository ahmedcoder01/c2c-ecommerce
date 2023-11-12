import asyncHandler from 'express-async-handler';
import { Router, raw } from 'express';
import validate from '../../middlewares/validation.middleware';
import { shippingAddressController } from '../../controllers';
import { shippingAddressValidations } from '../../validations';
import { requireAuth } from '../../middlewares/auth.middleware';

const shippingAdressesRouter = Router();

shippingAdressesRouter.get(
  '/shipping/addresses',
  requireAuth,
  asyncHandler(shippingAddressController.listUserShippingAddresses),
);

shippingAdressesRouter.post(
  '/shipping/addresses',
  requireAuth,
  validate(shippingAddressValidations.createShippingAddress),
  asyncHandler(shippingAddressController.createShippingAddress),
);

shippingAdressesRouter.get(
  '/shipping/addresses/:shippingAddressId',
  requireAuth,
  asyncHandler(shippingAddressController.getUserShippingAddress),
);

shippingAdressesRouter.put(
  '/shipping/addresses/:shippingAddressId',
  requireAuth,
  validate(shippingAddressValidations.updateShippingAddress),
  asyncHandler(shippingAddressController.updateShippingAddress),
);

shippingAdressesRouter.delete(
  '/shipping/addresses/:shippingAddressId',
  requireAuth,
  validate(shippingAddressValidations.deleteShippingAddress),
  asyncHandler(shippingAddressController.deleteShippingAddress),
);

export default shippingAdressesRouter;
