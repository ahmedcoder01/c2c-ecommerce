import { Product, ProductVariant, SellerProfile } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../../prisma/prisma-client';
import { ExpressHandler, ExpressHandlerWithParams } from '../../types';
import { sellerProductService, sellerService } from '../../services';
import { ProductRequestVariant } from '../../services/seller/product.seller.service';
import config from '../../config';
import HttpException from '../../utils/http-exception';
import { validateFields } from '../../utils/validate';
import { productValidations } from '../../validations';
import auctionsManager from '../../events/Auctions.event';

export const createProduct: ExpressHandler<
  {
    name: string;
    description: string;
    category: string;
    defaultImage: string;
  },
  any
> = async (req, res) => {
  const { sellerId } = req;
  const { name, description, category, defaultImage } = req.body;

  const product = await sellerProductService.createProduct(sellerId, {
    category,
    defaultImage,
    name,
    description,
  });

  res.status(httpStatus.CREATED).json({
    product,
  });
};

export const getSellerProducts: ExpressHandler<
  any,
  {
    products: any;
  }
> = async (req, res) => {
  const { sellerId } = req;

  const products = await sellerProductService.getSellerProducts(sellerId);

  res.status(httpStatus.OK).json({
    products,
  });
};

export const createProductVariant: ExpressHandlerWithParams<
  { productId: string },
  ProductRequestVariant,
  {
    productVariant: any;
  }
> = async (req, res) => {
  const variant = req.body;

  const { productId } = req.params;

  await sellerProductService.checkProductExistsOrThrow(productId);

  const productVariant = await sellerProductService.createProductVariant(productId, variant);

  res.status(httpStatus.CREATED).json({
    productVariant,
  });
};

export const getProduct: ExpressHandlerWithParams<
  { productId: string },
  any,
  {
    product: Product & {
      productVariants: ProductVariant[];
    };
  }
> = async (req, res) => {
  const { productId } = req.params;
  const { includeVariants } = req.query;

  const product = await sellerProductService.getProduct(productId, {
    includeVariants,
  });

  if (!product) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Product not found');
  }

  res.status(httpStatus.OK).json({
    product: product as any,
  });
};

export const getProductVariationOptions: ExpressHandlerWithParams<
  { productId: string },
  any,
  {
    options: any;
  }
> = async (req, res) => {
  const { productId } = req.params;

  const options = await sellerProductService.getProductVariationOptions(productId);

  res.status(httpStatus.OK).json({
    options,
  });
};

export const getProductVariant: ExpressHandlerWithParams<
  { productId: string; variantId: string },
  any,
  {
    productVariant: any;
  }
> = async (req, res) => {
  const { productId, variantId } = req.params;

  const productVariant = await sellerProductService.getProductVariantById(variantId);

  if (!productVariant) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Product variant not found');
  }

  res.status(httpStatus.OK).json({
    productVariant,
  });
};

export const deleteProduct: ExpressHandlerWithParams<{ productId: string }, {}, {}> = async (
  req,
  res,
) => {
  const { productId } = req.params;

  await sellerProductService.checkProductExistsOrThrow(productId);
  await sellerProductService.removeProduct(productId, req.sellerId);

  res.status(httpStatus.OK).json({
    message: 'Product deleted',
  });
};

export const deleteProductVariant: ExpressHandlerWithParams<{ variantId: string }, {}, {}> = async (
  req,
  res,
) => {
  const { variantId } = req.params;

  await sellerProductService.checkProductVariantExistsOrThrow(variantId);
  await sellerProductService.removeProductVariant(variantId, req.sellerId);

  res.status(httpStatus.OK).json({
    message: 'Product variant deleted',
  });
};

export const updateProduct: ExpressHandlerWithParams<
  { productId: string },
  {
    name: string;
    description: string;
    productCategory: {
      name: string;
    };
    defaultImage: string;
  },
  {
    product: any;
  }
> = async (req, res) => {
  const { productId } = req.params;
  const { name, description, productCategory, defaultImage } = req.body;

  await sellerProductService.checkProductExistsOrThrow(productId);
  if (productCategory) {
    await sellerProductService.checkCategoryExistsOrThrow(productCategory.name);
  }

  const product = await sellerProductService.updateProduct(productId, {
    name,
    description,
    productCategory,
    defaultImage,
  });

  res.status(httpStatus.OK).json({
    product,
  });
};

export const updateProductVariant: ExpressHandlerWithParams<
  { variantId: string; productId: string },
  ProductRequestVariant,
  {
    productVariant: any;
  }
> = async (req, res) => {
  const { variantId, productId } = req.params;
  const variant = req.body;

  await sellerProductService.checkProductVariantExistsOrThrow(variantId);

  const productVariant = await sellerProductService.updateProductVariant(
    variantId,
    productId,
    variant,
  );

  res.status(httpStatus.OK).json({
    productVariant,
  });
};
