import Joi from 'joi';

export const createCheckoutSession = {
  body: Joi.object().keys({
    shippingAddressId: Joi.string().required(),
  }),
};

export const confirmOrder = {
  params: Joi.object().keys({
    orderId: Joi.string().required(),
  }),
};
