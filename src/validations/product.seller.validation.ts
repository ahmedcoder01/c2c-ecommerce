import Joi, { any } from 'joi';

export const createProduct = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    defaultImage: Joi.string()
      .regex(/^((https)?(:\/\/)?.*\.(?:png|jpg|jpeg|gif|svg|webp))|(\/uploads\/.*)$/)
      .optional(),
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
          imageUrl: Joi.string()
            .regex(/^((https)?(:\/\/)?.*\.(?:png|jpg|jpeg|gif|svg|webp))|(\/uploads\/.*)$/)
            .optional(),
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
    imageUrl: Joi.string()
      .regex(/^((https)?(:\/\/)?.*\.(?:png|jpg|jpeg|gif|svg|webp))|(\/uploads\/.*)$/)
      .optional(),
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

export const getProduct = {
  params: Joi.object({
    productId: Joi.number().required(),
  }),
  query: Joi.object({
    includeVariants: Joi.boolean().default(false).optional(),
  }),
};

export const productGet = {
  params: Joi.object({
    productId: Joi.number().required(),
  }),
};

export const variantGet = {
  params: Joi.object({
    productId: Joi.number().required(),
    variantId: Joi.number().required(),
  }),
};

export const updateProduct = {
  params: Joi.object({
    productId: Joi.number().required(),
  }),
  body: Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    defaultImage: Joi.string()
      .regex(/^((https)?(:\/\/)?.*\.(?:png|jpg|jpeg|gif|svg|webp))|(\/uploads\/.*)$/)
      .optional(),

    productCategory: Joi.object({
      name: Joi.string().required(),
    }).optional(),
  }),
};

export const updateProductVariant = {
  params: Joi.object({
    productId: Joi.number().required(),
    variantId: Joi.number().required(),
  }),
  body: Joi.object({
    name: Joi.string().optional(),
    price: Joi.number().optional(),
    stock: Joi.number().optional(),
    imageUrl: Joi.string()
      .optional()
      .allow('')
      .allow(null)
      .regex(/^((https)?(:\/\/)?.*\.(?:png|jpg|jpeg|gif|svg|webp))|(\/uploads\/.*)$/),
  }),
};
