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
  const defaultImagePath = '/static/prod-img.png'; // temporary
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
            quantity: true,
            productVariantImage: true,
            variationOptions: {},
          },
        },
      }),
    },
  });
  return product;
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
      quantity: true,
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

  // Create product variant and connect to variation options
  // TODO: handle duplicate variant (determine if the variant is duplicate by checking if the variation options are the same)
  const variant = await prisma.productVariant.create({
    data: {
      name: variantInfo.name,
      price: variantInfo.price,
      quantity: variantInfo.stock,
      productVariantImage: variantInfo.image,
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
