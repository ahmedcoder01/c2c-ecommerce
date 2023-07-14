import Joi from 'joi';

// eslint-disable-next-line import/prefer-default-export
export const refresh = {
  cookies: Joi.object({
    'refresh-token': Joi.string(),
  }),
};
