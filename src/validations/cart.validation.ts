import Joi from 'joi';

export const addProductToCart = {
  body: Joi.object({
    productVariantId: Joi.string().required(),
    quantity: Joi.number().optional().min(1),
  }),
};
