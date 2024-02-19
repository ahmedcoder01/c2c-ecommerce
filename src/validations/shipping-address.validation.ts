import Joi from 'joi';

export const createShippingAddress = {
  body: Joi.object().keys({
    address: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    isDefault: Joi.boolean().required(),
  }),
};

export const updateShippingAddress = {
  params: Joi.object().keys({
    shippingAddressId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    address: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    isDefault: Joi.boolean().required(),
  }),
};

export const deleteShippingAddress = {
  params: Joi.object().keys({
    shippingAddressId: Joi.string().required(),
  }),
};
