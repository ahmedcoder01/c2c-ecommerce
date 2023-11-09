import { Product, ProductVariant, SellerProfile } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../../prisma/prisma-client';
import { ExpressHandler, ExpressHandlerWithParams } from '../../types';
import { productService, sellerService } from '../../services';
import { ProductRequestVariant } from '../../services/seller/product.seller.service';
import config from '../../config';
import HttpException from '../../utils/http-exception';
import { validateFields } from '../../utils/validate';
import { productValidations } from '../../validations';

export const createProduct: ExpressHandler<
  {
    name: string;
    description: string;
    category: string;
    defaultImage: string;
  },
  any
> = async (req, res) => {
  const { sellerId } = res.locals;
  const { name, description, category, defaultImage } = req.body;

  try {
    await productService.checkCategoryExistsOrThrow(category);
  } catch (error) {
    //! FOR Dev env, create category if not exists
    if (config.variables.env === 'development') {
      await productService.createCategory(category);
      return;
    }

    throw error;
  }

  const product = await productService.createProduct(sellerId, {
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
  const { sellerId } = res.locals;

  const products = await productService.getSellerProducts(sellerId);

  res.status(httpStatus.OK).json({
    products,
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
  const { includeVariants } = req.query;

  const product = await productService.getProduct(productId, {
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

export const getProductVariant: ExpressHandlerWithParams<
  { productId: number; variantId: number },
  any,
  {
    productVariant: any;
  }
> = async (req, res) => {
  const { productId, variantId } = req.params;

  const productVariant = await productService.getProductVariantById(variantId);

  if (!productVariant) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Product variant not found');
  }

  res.status(httpStatus.OK).json({
    productVariant,
  });
};

export const deleteProduct: ExpressHandlerWithParams<{ productId: number }, {}, {}> = async (
  req,
  res,
) => {
  const { productId } = req.params;

  await productService.checkProductExistsOrThrow(productId);
  await productService.removeProduct(productId, res.locals.sellerId);

  res.status(httpStatus.OK).json({
    message: 'Product deleted',
  });
};

export const deleteProductVariant: ExpressHandlerWithParams<{ variantId: number }, {}, {}> = async (
  req,
  res,
) => {
  const { variantId } = req.params;

  await productService.checkProductVariantExistsOrThrow(variantId);
  await productService.removeProductVariant(variantId, res.locals.sellerId);

  res.status(httpStatus.OK).json({
    message: 'Product variant deleted',
  });
};

export const updateProduct: ExpressHandlerWithParams<
  { productId: number },
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

  await productService.checkProductExistsOrThrow(productId);
  if (productCategory) {
    await productService.checkCategoryExistsOrThrow(productCategory.name);
  }

  const product = await productService.updateProduct(productId, {
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
  { variantId: number; productId: number },
  ProductRequestVariant,
  {
    productVariant: any;
  }
> = async (req, res) => {
  const { variantId, productId } = req.params;
  const variant = req.body;

  await productService.checkProductVariantExistsOrThrow(variantId);

  const productVariant = await productService.updateProductVariant(variantId, productId, variant);

  res.status(httpStatus.OK).json({
    productVariant,
  });
};
