// TODO:
// 1. CHECK FOR variance existence
// 2. HANDLE edge cases
// 3. UPLOAD image (at least to fs for now)

import { Product, ProductVariant, SellerProfile } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import { ExpressHandler, ExpressHandlerWithParams } from '../types';
import { productService, sellerService } from '../services';
import { ProductRequestVariant } from '../services/product.seller.service';
import config from '../config';
import HttpException from '../utils/http-exception';

export const createProduct: ExpressHandler<
  {
    name: string;
    description: string;
    defaultImage: string;
    category: string;
  },
  any
> = async (req, res) => {
  const { sellerId } = res.locals;
  const { name, description, defaultImage, category } = req.body;

  try {
    await productService.checkCategoryExistsOrThrow(category);
  } catch (error) {
    if (config.variables.env === 'development') {
      await productService.createCategory(category);
      return;
    }

    throw error;
  }
  //! FOR Dev env, create category if not exists

  // TODO: upload image
  const defaultImagePath = '/static/prod-img.png'; // temporary

  const product = await productService.createProduct(sellerId, {
    category,
    defaultImage: defaultImagePath,
    name,
    description,
  });

  res.status(httpStatus.CREATED).json({
    product,
  });
};

export const createProductVariant: ExpressHandlerWithParams<
  { productId: number },
  ProductRequestVariant,
  {
    productVariant: ProductVariant;
  }
> = async (req, res) => {
  const variant = req.body;
  const { productId } = req.params;

  await productService.checkProductExistsOrThrow(productId);

  const productVariant = await productService.createProductVariant(productId, variant);

  res.status(httpStatus.CREATED).json({
    productVariant,
  });
};

export const getProduct: ExpressHandlerWithParams<
  { productId: number },
  any,
  {
    product: Product & {
      productVariants: ProductVariant[];
    };
  }
> = async (req, res) => {
  const { productId } = req.params;

  const product = await productService.getProduct(productId, {
    includeVariants: true,
  });

  if (!product) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Product not found');
  }

  res.status(httpStatus.OK).json({
    product: product as any,
  });
};

export const getProductVariationOptions: ExpressHandlerWithParams<
  { productId: number },
  any,
  {
    options: any;
  }
> = async (req, res) => {
  const { productId } = req.params;

  const options = await productService.getProductVariationOptions(productId);

  res.status(httpStatus.OK).json({
    options,
  });
};
