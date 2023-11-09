import Joi from 'joi';

export const registerSeller = {
  body: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
  }),
};
