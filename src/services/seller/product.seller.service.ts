/* eslint-disable no-underscore-dangle */
import httpStatus from 'http-status';
import _ from 'lodash';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../utils/http-exception';
import { PrismaTransaction } from '../../types/requests.type';
import config from '../../config';
import logger from '../../logger';
import auctionsManager from '../../events/Auctions.event';
import { sellerProductService } from '..';

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

  hasAuctionMethod?: boolean;
  auction?: {
    startDateTime: Date;
    biddingDurationHrs: number;
    startingPrice: number;
  };

  variationOptions: VariationOption[];
}

export const createProduct = async (
  sellerId: string,
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
  const _product = await prisma.$transaction(async tx => {
    try {
      await sellerProductService.checkCategoryExistsOrThrow(category, { tx });
    } catch (error) {
      //! FOR Dev env, create category if not exists
      if (config.variables.env === 'development') {
        await sellerProductService.createCategory(category, { tx });
        return;
      }

      throw error;
    }
    const product = await tx.product.create({
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
  });

  return _product;
};

export const removeProduct = async (productId: string, sellerId: string) => {
  // TODO: what if there are orders linked to this product?

  await prisma.product.delete({
    where: {
      id: productId,

      sellerProfile: {
        id: sellerId,
      },
    },
  });
};

export const getProduct = async (
  productId: string,
  options?: {
    includeVariants?: boolean;
  },
) => {
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

export const getSellerProducts = async (sellerId: string) => {
  const products = await prisma.product.findMany({
    where: {
      sellerProfileId: sellerId,
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

export const getProductVariants = async (productId: string) => {
  const productVariants = await prisma.productVariant.findMany({
    where: {
      productId: productId,
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

export const removeProductVariant = async (variantId: string, sellerId: string) => {
  // TODO: what if there are orders linked to this product variant?

  await prisma.productVariant.delete({
    where: {
      id: variantId,
      product: {
        sellerProfile: {
          id: sellerId,
        },
      },
    },
  });
};

export const getProductVariationOptions = async (productId: string) => {
  const productVariantOptions = await prisma.variationOption.findMany({
    where: {
      productVariants: {
        some: {
          productId: productId,
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
  productId: string,
  variantKeysAndValues: {
    key: string;
    value: any;
  }[],
  options?: {
    tx: PrismaTransaction;
  },
) => {
  const _p = options?.tx || prisma;
  const existingVariants = await _p.productVariant.findMany({
    where: {
      productId: productId,
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

export const checkProductVariantExistsOrThrow = async (variantId: string) => {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
    },
  });
  if (!variant) {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Product variant does not exist');
  }
};

export const createProductVariant = async (
  productId: string,
  variantInfo: ProductRequestVariant,
) => {
  const variant = await prisma.$transaction(async tx => {
    const product = await tx.product.findFirst({
      where: {
        id: productId,
      },
      select: {
        productCategory: {
          select: {
            name: true,
          },
        },
      },
    });

    const productCategoryName = product?.productCategory.name;

    // Prepare variation keys and options
    const variantKeysAndValues = await Promise.all(
      variantInfo.variationOptions.map(async option => {
        const keyRecord = await tx.variation.upsert({
          where: { name: option.name },
          update: {},
          create: {
            name: option.name,
            productCategory: { connect: { name: productCategoryName } },
          },
          select: { id: true },
        });

        let valueRecord = await tx.variationOption.findFirst({
          where: { variation: { id: keyRecord.id }, value: option.value },
          select: { id: true },
        });

        if (!valueRecord) {
          valueRecord = await tx.variationOption.create({
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

    await checkProductVariantIsUniqueOrThrow(productId, variantKeysAndValues, { tx });

    const { startDateTime, biddingDurationHrs, startingPrice } = variantInfo.auction || {};
    const isValidAuction =
      startDateTime && biddingDurationHrs !== undefined && startingPrice !== undefined;

    let endDate;

    if (variantInfo.hasAuctionMethod && !isValidAuction) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Invalid auction info');
    }

    if (variantInfo.hasAuctionMethod && isValidAuction) {
      if (biddingDurationHrs < 6) {
        throw new HttpException(
          httpStatus.BAD_REQUEST,
          'Bidding duration must be at least 6 hours',
        );
      }

      if (startDateTime.getTime() < Date.now()) {
        throw new HttpException(httpStatus.BAD_REQUEST, 'Start date must be in the future');
      }

      endDate = new Date(startDateTime.getTime() + biddingDurationHrs * 60 * 60 * 1000);
    }

    const _variant = await tx.productVariant.create({
      data: {
        name: variantInfo.name,
        price: variantInfo.price,
        stock: variantInfo.stock,
        productVariantImage: variantInfo.imageUrl,
        product: { connect: { id: productId } },

        hasAuctionOption: variantInfo.hasAuctionMethod,
        ...(isValidAuction &&
          variantInfo.hasAuctionMethod && {
            auction: {
              create: {
                auctionStartDate: variantInfo.auction?.startDateTime as Date,
                auctionEndDate: endDate as Date,
                minimumBidPrice: variantInfo.auction?.startingPrice as number,
              },
            },
          }),

        variationOptions: {
          connect: variantKeysAndValues.map(({ key, value }) => ({
            id: value,
            variation: { id: key },
          })),
        },
      },

      include: {
        auction: {
          select: {
            id: true,
            auctionStartDate: true,
            auctionEndDate: true,
            auctionStatus: true,
          },
        },
      },
    });

    return _variant;
  });

  if (!variant.hasAuctionOption) return variant;

  auctionsManager.emit('scheduleAuctionStart', {
    auctionId: variant.auction!.id,
    startAt: variant.auction!.auctionStartDate,
  });

  auctionsManager.emit('scheduleAuctionEnd', {
    auctionId: variant.auction!.id,
    endAt: variant.auction!.auctionEndDate,
  });

  return variant;
};

export const getProductVariantById = async (variantId: string) => {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
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

export const checkProductExistsOrThrow = async (productId: string) => {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
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
  productId: string,
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
      id: productId,
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
  variantId: string,
  productId: string,
  variantInfo: Partial<Pick<ProductRequestVariant, 'name' | 'price' | 'stock' | 'imageUrl'>>,
) => {
  const productVariant = await prisma.productVariant.update({
    where: {
      id: variantId,
      productId: productId,
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
