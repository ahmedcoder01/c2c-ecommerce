import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import { cartService, sellerProductService } from '../services';
import { ExpressHandler } from '../types';

export const getCartByUserId: ExpressHandler<
  {},
  {
    cart: any;
  }
> = async (req, res) => {
  const { userId } = req;
  const cartId = await cartService.getUserCartId(userId);
  const cart = await cartService.getCartDetails(cartId);

  return res.status(httpStatus.OK).json({
    cart,
  });
};

export const addProductToCart: ExpressHandler<
  { productVariantId: string; quantity?: number },
  {
    cartItem: any;
  }
> = async (req, res) => {
  const { userId } = req;
  const { productVariantId, quantity = 1 } = req.body;

  const cartId = await cartService.getUserCartId(userId);
  const cartItem = await cartService.addProductToCart(productVariantId, quantity, cartId);

  return res.status(httpStatus.OK).json({
    message: 'Product added to cart successfully',
    cartItem,
  });
};

export const removeProductFromCart: ExpressHandler<{ cartItemId: string }, {}> = async (
  req,
  res,
) => {
  const { cartItemId } = req.params;

  await cartService.removeProductFromCart(cartItemId);

  return res.status(httpStatus.OK).json({
    message: 'Cart item removed successfully',
  });
};
