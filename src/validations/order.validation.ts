import Joi from 'joi';

export const createCheckoutSession = {
  body: Joi.object().keys({
    shippingAddressId: Joi.number().required(),
  }),
};
