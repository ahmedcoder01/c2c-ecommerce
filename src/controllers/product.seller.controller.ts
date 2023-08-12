// TODO:
// 1. CHECK FOR variance existence
// 2. HANDLE edge cases
// 3. UPLOAD image (at least to fs for now)

import { Product, ProductVariant, SellerProfile } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import { ExpressHandler, ExpressHandlerWithParams } from '../types';
import { authService, productService, sellerService } from '../services';
import HttpException from '../utils/http-exception';
import { ProductRequestVariant } from '../services/product.seller.service';
import config from '../config';

export const createProduct: ExpressHandler<
  {
    defaultName: string;
    description: string;
    defaultImage: string;
    category: string;
  },
  any
> = async (req, res) => {
  const { sellerId } = res.locals;
  const { defaultName, description, defaultImage, category } = req.body;

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
    defaultName,
    description,
  });

  res.status(httpStatus.CREATED).json(product);
};

export const createProductVariant: ExpressHandler<
  {
    variant: ProductRequestVariant;
    productId: number;
  },
  {
    productVariant: ProductVariant;
  }
> = async (req, res) => {
  const { variant, productId } = req.body;

  await productService.checkProductExistsOrThrow(productId);

  const productVariant = await productService.createProductVariant(productId, variant);

  res.status(httpStatus.CREATED).json({
    productVariant,
  });
};
