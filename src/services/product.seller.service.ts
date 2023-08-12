import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import HttpException from '../utils/http-exception';

export interface ProductRequestVariant {
  name: string;
  price: number;
  stock: number;
  image: string;

  variationOptions: {
    name: string;
    value: string;
  }[];
}

export const createProduct = async (
  sellerId: number,
  {
    defaultName,
    description,
    defaultImage,
    category,
  }: {
    defaultName: string;
    description: string;
    defaultImage: string;
    category: string;
  },
) => {
  const defaultImagePath = '/static/prod-img.png'; // temporary
  const product = await prisma.product.create({
    data: {
      name: defaultName,
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
export const getProduct = async (productId: number) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
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
    },
  });
  return product;
};

export const createProductVariant = async (
  productId: number,
  variantInfo: ProductRequestVariant,
) => {
  //* createMany is not supported in SQLite

  const product = await getProduct(productId);

  // create or/and map variation options and variation to their ids
  const variantKeysAndValues = await Promise.all(
    variantInfo.variationOptions.map(async option => {
      const keyRecord = await prisma.variation.upsert({
        where: {
          name: option.name,
        },
        update: {},
        create: {
          name: option.name,
          productCategory: {
            connect: {
              name: product?.productCategory.name,
            },
          },
        },
        select: {
          id: true,
        },
      });

      let valueRecord = await prisma.variationOption.findFirst({
        where: {
          variation: {
            id: keyRecord.id,
          },
          value: option.value,
        },
        select: {
          id: true,
        },
      });

      if (!valueRecord) {
        valueRecord = await prisma.variationOption.create({
          data: {
            variation: {
              connect: {
                id: keyRecord.id,
              },
            },
            value: option.value,
          },
          select: {
            id: true,
          },
        });
      }

      return {
        key: keyRecord.id,
        value: valueRecord.id,
      };
    }),
  );

  const variant = await prisma.productVariant.create({
    data: {
      name: variantInfo.name,
      price: variantInfo.price,
      quantity: variantInfo.stock,
      productVariantImage: variantInfo.image,
      product: {
        connect: {
          id: productId,
        },
      },
      variationOptions: {
        connect: variantKeysAndValues.map(({ key, value }) => ({
          id: value,
          variation: {
            id: key,
          },
        })),
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
      id: productId,
    },
  });
  if (!productExists) {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Product does not exist');
  }
};
