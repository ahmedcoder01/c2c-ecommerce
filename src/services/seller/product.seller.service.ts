/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import _ from 'lodash';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../utils/http-exception';
import { PrismaTransaction } from '../../types/requests.type';
import config from '../../config';
import logger from '../../logger';

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
  const product = await prisma.product.create({
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
  // TODO: what if there are orders linked to this product?

  await prisma.product.delete({
    where: {
      id: +productId,

      sellerProfile: {
        id: sellerId,
      },
    },
  });
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

export const removeProductVariant = async (variantId: number, sellerId: number) => {
  // TODO: what if there are orders linked to this product variant?

  await prisma.productVariant.delete({
    where: {
      id: +variantId,
      product: {
        sellerProfile: {
          id: sellerId,
        },
      },
    },
  });
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

export const checkCategoryExistsOrThrow = async (
  category: string,
  options?: {
    tx: PrismaTransaction;
  },
) => {
  const _p = options?.tx || prisma;
  const categoryExists = await _p.productCategory.findFirst({
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

export const createCategory = async (
  name: string,
  options?: {
    tx: PrismaTransaction;
  },
) => {
  const _p = options?.tx || prisma;
  const category = await _p.productCategory.upsert({
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
  const product = await prisma.product.findFirst({
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
  const product = await prisma.product.update({
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
  const productVariant = await prisma.productVariant.update({
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

// BIDDING PRODUCTS

export const createBiddingProduct = async (
  sellerId: number,
  {
    name,
    description,
    defaultImage,
    category,
    startDateTime,
    biddingDurationHrs,
    startingPrice,
  }: {
    name: string;
    description: string;
    defaultImage: string;
    category: string;
    startDateTime: Date;
    biddingDurationHrs: number;
    startingPrice: number;
  },
) => {
  const startDate = new Date(startDateTime);
  const endDate = new Date(startDate.getTime() + biddingDurationHrs * 60 * 60 * 1000);
  const MIN_BIDDING_DURATION_HRS = 6;

  if (startDate.getTime() < Date.now()) {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Start date must be in the future');
  }

  if (biddingDurationHrs < MIN_BIDDING_DURATION_HRS) {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Bidding duration must be at least 6 hours');
  }

  const product = await prisma.$transaction(async tx => {
    try {
      await checkCategoryExistsOrThrow(category, { tx });
    } catch (error) {
      //! FOR Dev env, create category if not exists
      if (config.variables.env === 'development') {
        await createCategory(category, { tx });
      } else {
        throw error;
      }
    }

    const _product = await tx.auctionProduct.create({
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
        auctionStartDate: startDate,
        auctionEndDate: endDate,
        minimumBidPrice: startingPrice,
        auctionStatus: 'PENDING',
      },
    });
    return _product;
  });
  return product;
};

export const deleteBiddingProduct = async (bProductId: number, sellerId: number) => {
  await prisma.$transaction(async tx => {
    const product = await tx.auctionProduct.findFirst({
      where: {
        id: +bProductId,
        sellerProfile: {
          id: sellerId,
        },
      },
      select: {
        auctionStatus: true,
      },
    });
    if (!product) throw new HttpException(httpStatus.BAD_REQUEST, 'Product does not exist');

    if (product.auctionStatus === 'STARTED') {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Bidding has started. Cannot delete product');
    }

    await tx.auctionProduct.delete({
      where: {
        id: +bProductId,
        sellerProfile: {
          id: sellerId,
        },
      },
    });
  });
};

export const listBiddingProducts = async (sellerId: number) => {
  const products = await prisma.auctionProduct.findMany({
    where: {
      sellerProfile: {
        id: sellerId,
      },
    },
    select: {
      id: true,
      name: true,
      defaultImage: true,
      description: true,
      auctionStartDate: true,
      auctionEndDate: true,
      minimumBidPrice: true,
      auctionStatus: true,
    },
  });
  return products;
};

export const getBiddingProduct = async (productId: number) => {
  const product = await prisma.auctionProduct.findFirst({
    where: {
      id: +productId,
    },
    select: {
      id: true,
      name: true,
      defaultImage: true,
      description: true,
      auctionStartDate: true,
      auctionEndDate: true,
      minimumBidPrice: true,
      auctionStatus: true,
    },
  });
  return product;
};
