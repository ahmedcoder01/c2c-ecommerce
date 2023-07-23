import Joi from 'joi';

// eslint-disable-next-line import/prefer-default-export
export const refresh = {
  cookies: Joi.object({
    'refresh-token': Joi.string().required(),
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

export const me = {
  cookies: Joi.object({
    'access-token': Joi.string().required(),
  }),
  
}
