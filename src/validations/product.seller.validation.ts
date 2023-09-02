import Joi from 'joi';

export const createProduct = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    imageUrl: Joi.string().required(),
  }),
};

export const createProductVariants = {
  body: Joi.object().keys({
    variants: Joi.array().items(
      Joi.object()
        .keys({
          name: Joi.string().required(),
          price: Joi.number().required(),
          stock: Joi.number().required(),
          imageUrl: Joi.string().required(),

          variationOptions: Joi.array()
            .items(
              Joi.object().keys({
                name: Joi.string().required(),
                value: Joi.string().required(),
              }),
            )
            .required(),
        })
        .required(),
    ),
    productId: Joi.number().required(),
  }),
};
export const createProductVariant = {
  params: Joi.object().keys({
    productId: Joi.number().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
    price: Joi.number().required(),
    stock: Joi.number().required(),
    imageUrl: Joi.string().required(),

    // stringified array of objects
    variationOptions: Joi.array()
      .items(
        Joi.object().keys({
          name: Joi.string().required(),
          value: Joi.string().required(),
        }),
      )
      .required(),
  }),
};

export const variationOptions = Joi.array()
  .items(
    Joi.object().keys({
      name: Joi.string().required(),
      value: Joi.string().required(),
    }),
  )
  .required();
