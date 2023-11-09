import httpStatus from 'http-status';
import Joi, { ObjectSchema, Schema } from 'joi';
import pick from './pick';
import HttpException from './http-exception';

export const validateFields = (data: any, schema: Schema) => {
  const { error } = schema.validate(data);
  if (error) {
    throw new HttpException(httpStatus.BAD_REQUEST, error.message);
  }
};
