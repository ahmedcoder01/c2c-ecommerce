/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import _ from 'lodash';
import prisma from '../../prisma/prisma-client';
import HttpException from '../utils/http-exception';

// TODO: broken product variant duplication check
// TODO: handle the situation of deleting a product/variant that is stored in any other tables like the cartItem, etc
// TODO: REMOVE THE SOFT DELETE
interface VariationOption {
  name: string;
  value: string;
}
export interface ProductRequestVariant {
  name: string;
  price: number;
  stock: number;
  imageUrl: string;

  variationOptions: VariationOption[];
}

//* Soft delete prisma to handle soft delete

const softDeletePrisma = prisma.$extends({
  query: {
    product: {
      async findFirst({ model, operation, args, query }) {
        // eslint-disable-next-line no-param-reassign
        args.where = {
          ...args.where,
          deletedAt: null,
        };

        return query(args);
      },

      async findMany({ model, operation, args, query }) {
        // eslint-disable-next-line no-param-reassign
        args.where = {
          ...args.where,
          deletedAt: null,
        };

        return query(args);
      },

      async count({ model, operation, args, query }) {
        // eslint-disable-next-line no-param-reassign
        args.where = {
          ...args.where,
          deletedAt: null,
        };

        return query(args);
      },

      async findUnique({ model, operation, args, query }) {
        // eslint-disable-next-line no-param-reassign
        args.where = {
          ...args.where,
          deletedAt: null,
        };

        return query(args);
      },

      upsert({ model, operation, args, query }) {
        // eslint-disable-next-line no-param-reassign
        args.where = {
          ...args.where,
          deletedAt: null,
        };

        return query(args);
      },

      // add any other query methods you want to override here to handle soft delete
    },
  },
});

export const createProduct = async (
  sellerId: number,
  {
    name,
    description,
    defaultImage,
    category,
  }: {
    name: string;
    description: string;
    defaultImage: string;
    category: string;
  },
) => {
  const product = await softDeletePrisma.product.create({
    data: {
      name,
      defaultImage,
      sellerProfile: {
        connect: {
          id: sellerId,
        },
      },
      description,
      productCategory: {
        connect: {
          name: category,
        },
      },
    },
  });
  return product;
};

export const removeProduct = async (productId: number, sellerId: number) => {
  // check if any order items linked to this product, if so, soft delete, else hard delete

  const orderItem = await softDeletePrisma.orderItem.findFirst({
    where: {
      productVariant: {
        product: {
          id: +productId,
        },
      },
    },
  });

  if (orderItem) {
    await softDeletePrisma.$transaction([
      softDeletePrisma.product.update({
        where: {
          id: +productId,
          sellerProfile: {
            id: sellerId,
          },
        },
        data: {
          deletedAt: new Date(),
        },
      }),
      softDeletePrisma.productVariant.updateMany({
        where: {
          productId: +productId,
        },
        data: {
          deletedAt: new Date(),
        },
      }),
    ]);
  } else {
    await softDeletePrisma.product.delete({
      where: {
        id: +productId,

        sellerProfile: {
          id: sellerId,
        },
      },
    });
  }
};

export const getProduct = async (
  productId: number,
  options?: {
    includeVariants?: boolean;
  },
) => {
  const product = await softDeletePrisma.product.findFirst({
    where: {
      id: +productId,
    },
    select: {
      id: true,
      defaultImage: true,
      name: true,
      sellerProfileId: true,
      updatedAt: true,
      description: true,
      createdAt: true,
      productCategory: {
        select: {
          name: true,
        },
      },

      ...(options?.includeVariants && {
        productVariants: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            productVariantImage: true,
            variationOptions: {},
          },
        },
      }),
    },
  });
  return product;
};

export const getSellerProducts = async (sellerId: number) => {
  const products = await softDeletePrisma.product.findMany({
    where: {
      sellerProfileId: +sellerId,
    },
    select: {
      id: true,
      defaultImage: true,
      name: true,
      updatedAt: true,
      description: true,
      createdAt: true,
      productCategory: {
        select: {
          name: true,
        },
      },
    },
  });
  return products;
};

export const getProductVariants = async (productId: number) => {
  const productVariants = await softDeletePrisma.productVariant.findMany({
    where: {
      productId: +productId,
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      productVariantImage: true,
      variationOptions: {
        select: {
          id: true,
          value: true,
          variation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  return productVariants;
};

export const removeProductVariant = async (variantId: number, sellerId: number) => {
  // check if any order items linked to this variant, if so, soft delete, else hard delete
  const orderItems = await softDeletePrisma.orderItem.findFirst({
    where: {
      productVariantId: +variantId,
    },
  });

  if (orderItems) {
    await softDeletePrisma.productVariant.update({
      where: {
        id: +variantId,
        product: {
          sellerProfile: {
            id: sellerId,
          },
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  } else {
    await softDeletePrisma.productVariant.delete({
      where: {
        id: +variantId,
        product: {
          sellerProfile: {
            id: sellerId,
          },
        },
      },
    });
  }
};

export const getProductVariationOptions = async (productId: number) => {
  const productVariantOptions = await softDeletePrisma.variationOption.findMany({
    where: {
      productVariants: {
        some: {
          productId: +productId,
        },
      },
    },

    select: {
      variation: {
        select: {
          id: true,
          name: true,
        },
      },
      value: true,
    },
  });

  // @ts-ignore
  const groupedByKeys = productVariantOptions.reduce((acc, curr) => {
    // @ts-ignore
    acc[curr.variation.name] = [curr.value, ...(acc[curr.variation.name] || [])];
    return acc;
  }, {});

  return groupedByKeys;
};

export const checkProductVariantIsUniqueOrThrow = async (
  productId: number,
  variantKeysAndValues: {
    key: number;
    value: number;
  }[],
) => {
  const existingVariants = await softDeletePrisma.productVariant.findMany({
    where: {
      productId: +productId,
    },
    select: {
      variationOptions: {
        select: {
          id: true,
          variation: {
            select: {
              name: true,
              id: true,
            },
          },
        },
      },
    },
  });

  const existingVariantsWithKeysAndValues = existingVariants.map(variant => {
    const variationOptions = variant.variationOptions.map(option => ({
      key: option.variation.id,
      value: option.id,
    }));
    return variationOptions;
  });

  for (const existingKeysAndValues of existingVariantsWithKeysAndValues) {
    if (
      JSON.stringify(variantKeysAndValues.sort()) === JSON.stringify(existingKeysAndValues.sort())
    ) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Product variant already exists');
    }
  }
};

export const checkProductVariantExistsOrThrow = async (variantId: number) => {
  const variant = await softDeletePrisma.productVariant.findFirst({
    where: {
      id: +variantId,
    },
  });
  if (!variant) {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Product variant does not exist');
  }
};

export const createProductVariant = async (
  productId: number,
  variantInfo: ProductRequestVariant,
) => {
  const product = await getProduct(productId);
  const productCategoryName = product?.productCategory.name;

  // Prepare variation keys and options
  const variantKeysAndValues = await Promise.all(
    variantInfo.variationOptions.map(async option => {
      const keyRecord = await softDeletePrisma.variation.upsert({
        where: { name: option.name },
        update: {},
        create: {
          name: option.name,
          productCategory: { connect: { name: productCategoryName } },
        },
        select: { id: true },
      });

      let valueRecord = await softDeletePrisma.variationOption.findFirst({
        where: { variation: { id: keyRecord.id }, value: option.value },
        select: { id: true },
      });

      if (!valueRecord) {
        valueRecord = await softDeletePrisma.variationOption.create({
          data: {
            variation: { connect: { id: keyRecord.id } },
            value: option.value,
          },
          select: { id: true },
        });
      }

      return { key: keyRecord.id, value: valueRecord.id };
    }),
  );

  await checkProductVariantIsUniqueOrThrow(productId, variantKeysAndValues);

  const variant = await softDeletePrisma.productVariant.create({
    data: {
      name: variantInfo.name,
      price: variantInfo.price,
      stock: variantInfo.stock,
      productVariantImage: variantInfo.imageUrl,
      product: { connect: { id: productId } },
      variationOptions: {
        connect: variantKeysAndValues.map(({ key, value }) => ({
          id: value,
          variation: { id: key },
        })),
      },
    },
  });
  return variant;
};

export const getProductVariantById = async (variantId: number) => {
  const variant = await softDeletePrisma.productVariant.findFirst({
    where: {
      id: +variantId,
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      productVariantImage: true,
      variationOptions: {
        select: {
          id: true,
          value: true,
          variation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  return variant;
};

export const checkCategoryExistsOrThrow = async (category: string) => {
  const categoryExists = await softDeletePrisma.productCategory.findFirst({
    where: {
      name: category,
    },

    select: {
      id: true,
    },
  });
  if (!categoryExists) {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Category does not exist');
  }
};

export const createCategory = async (name: string) => {
  const category = await softDeletePrisma.productCategory.upsert({
    where: {
      name,
    },
    update: {},
    create: {
      name,
    },
  });

  return category;
};

export const checkProductExistsOrThrow = async (productId: number) => {
  const product = await softDeletePrisma.product.findFirst({
    where: {
      id: +productId,
    },

    select: {
      id: true,
    },
  });

  if (!product) {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Product does not exist');
  }
};

export const updateProduct = async (
  productId: number,
  {
    name,
    description,
    productCategory,
    defaultImage,
  }: {
    name?: string;
    description?: string;
    productCategory?: {
      name: string;
    };
    defaultImage?: string;
  },
) => {
  // if varia
  const product = await softDeletePrisma.product.update({
    where: {
      id: +productId,
    },
    data: {
      name,
      description,
      defaultImage,
      ...(productCategory?.name && {
        productCategory: {
          connect: {
            name: productCategory.name,
          },
        },
      }),
    },

    select: {
      id: true,
      name: true,
      description: true,
      defaultImage: true,
      productCategory: {
        select: {
          name: true,
        },
      },
    },
  });

  return product;
};

export const updateProductVariant = async (
  variantId: number,
  productId: number,
  variantInfo: Partial<Pick<ProductRequestVariant, 'name' | 'price' | 'stock' | 'imageUrl'>>,
) => {
  const productVariant = await softDeletePrisma.productVariant.update({
    where: {
      id: +variantId,
      productId: +productId,
    },
    data: {
      name: variantInfo.name,
      price: variantInfo.price,
      stock: variantInfo.stock,
      productVariantImage: variantInfo.imageUrl,
    },
  });

  return productVariant;
};

// eslint-disable-next-line no-underscore-dangle
const _tools = {
  softDeletePrisma,
};
export { _tools };
