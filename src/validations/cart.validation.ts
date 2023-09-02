import Joi from 'joi';

export const addProductToCart = {
  body: Joi.object({
    productVariantId: Joi.number().required(),
    quantity: Joi.number().optional().min(1),
  }),
};
