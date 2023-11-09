import asyncHandler from 'express-async-handler';
import { Router, raw } from 'express';
import validate from '../../middlewares/validation.middleware';
import { shippingAddressController } from '../../controllers';
import { shippingAddressValidations } from '../../validations';

const shippingAdressesRouter = Router();

shippingAdressesRouter.get(
  '/shipping/addresses',
  asyncHandler(shippingAddressController.listUserShippingAddresses),
);

shippingAdressesRouter.post(
  '/shipping/addresses',
  validate(shippingAddressValidations.createShippingAddress),
  asyncHandler(shippingAddressController.createShippingAddress),
);

shippingAdressesRouter.get(
  '/shipping/addresses/:shippingAddressId',
  asyncHandler(shippingAddressController.getUserShippingAddress),
);

shippingAdressesRouter.put(
  '/shipping/addresses/:shippingAddressId',
  validate(shippingAddressValidations.updateShippingAddress),
  asyncHandler(shippingAddressController.updateShippingAddress),
);

shippingAdressesRouter.delete(
  '/shipping/addresses/:shippingAddressId',
  validate(shippingAddressValidations.deleteShippingAddress),
  asyncHandler(shippingAddressController.deleteShippingAddress),
);

export default shippingAdressesRouter;
