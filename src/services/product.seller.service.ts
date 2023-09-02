import httpStatus from 'http-status';
import _ from 'lodash';
import prisma from '../../prisma/prisma-client';
import HttpException from '../utils/http-exception';

// TODO: broken product variant duplication check

export interface ProductRequestVariant {
  name: string;
  price: number;
  stock: number;
  imageUrl: string;

  variationOptions: {
    name: string;
    value: string;
  }[];
}

export const createProduct = async (
  sellerId: number,
  {
    name,
    description,
    defaultImagePath,
    category,
  }: {
    name: string;
    description: string;
    defaultImagePath: string;
    category: string;
  },
) => {
  const product = await prisma.product.create({
    data: {
      name,
      defaultImage: defaultImagePath,
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
export const getProduct = async (
  productId: number,
  options?: {
    includeVariants?: boolean;
  },
) => {
  const product = await prisma.product.findFirst({
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
  const products = await prisma.product.findMany({
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
  const productVariants = await prisma.productVariant.findMany({
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

export const getProductVariationOptions = async (productId: number) => {
  const productVariantOptions = await prisma.variationOption.findMany({
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
  const existingVariants = await prisma.productVariant.findMany({
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
  const variant = await prisma.productVariant.findFirst({
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
      const keyRecord = await prisma.variation.upsert({
        where: { name: option.name },
        update: {},
        create: {
          name: option.name,
          productCategory: { connect: { name: productCategoryName } },
        },
        select: { id: true },
      });

      let valueRecord = await prisma.variationOption.findFirst({
        where: { variation: { id: keyRecord.id }, value: option.value },
        select: { id: true },
      });

      if (!valueRecord) {
        valueRecord = await prisma.variationOption.create({
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

  const variant = await prisma.productVariant.create({
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
  const variant = await prisma.productVariant.findFirst({
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
  const categoryExists = await prisma.productCategory.findFirst({
    where: {
      name: category,
    },
  });
  if (!categoryExists) {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Category does not exist');
  }
};

export const createCategory = async (name: string) => {
  const category = await prisma.productCategory.upsert({
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
  const productExists = await prisma.product.findFirst({
    where: {
      id: +productId,
    },
  });
  if (!productExists) {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Product does not exist');
  }
};
