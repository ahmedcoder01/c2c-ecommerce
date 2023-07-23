import Joi from 'joi';

// eslint-disable-next-line import/prefer-default-export
export const refresh = {
  cookies: Joi.object({
    'refresh-token': Joi.string().message("Unauthorized"),
  }),
};

export const signup = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
  }),
};

export const login = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};