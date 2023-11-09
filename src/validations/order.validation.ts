import Joi from 'joi';

export const createCheckoutSession = {
  body: Joi.object().keys({
    shippingAddressId: Joi.number().required(),
  }),
};

export const confirmOrder = {
  params: Joi.object().keys({
    orderId: Joi.number().required(),
  }),
};
