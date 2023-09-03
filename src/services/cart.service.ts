import { Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { search } from './search-engine.service';
import { productService } from '.';
import prisma from '../../prisma/prisma-client';

export const addProductToCart = async (
  productVariantId: number,
  quantity: number,
  cartId: number,
) => {
  const productVariant = await productService.getProductVariantById(productVariantId);

  if (!productVariant) {
    throw new Error('Product variant not found');
  }

  if (productVariant?.stock === 0) {
    throw new Error('Stock is not enough');
  }

  const exisitingItem = await prisma.cartItem.findFirst({
    where: {
      cartId,
      productVariantId,
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  if ((exisitingItem?.quantity ?? 0) + quantity > productVariant.stock) {
    throw new Error('Stock is not enough');
  }

  if (exisitingItem) {
    return prisma.cartItem.update({
      where: {
        id: exisitingItem.id,
      },
      data: {
        quantity: exisitingItem.quantity + quantity,
      },
    });
  }

  return prisma.cartItem.create({
    data: {
      quantity,
      cart: {
        connect: {
          id: cartId,
        },
      },
      productVariant: {
        connect: {
          id: productVariantId,
        },
      },
    },
  });
};

export const removeProductFromCart = async (cartItemId: number) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: {
      id: cartItemId,
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  if (cartItem.quantity > 1) {
    return prisma.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: {
        quantity: cartItem.quantity - 1,
      },
    });
  }

  await prisma.cartItem.delete({
    where: {
      id: cartItemId,
    },
  });

  return null;
};

export const getCartDetails = async (cartId: number) => {
  let cartItems = await prisma.cartItem.findMany({
    where: {
      cart: {
        id: cartId,
      },
    },
    select: {
      id: true,
      quantity: true,
      productVariant: {
        select: {
          id: true,
          price: true,
          stock: true,
          product: {
            select: {
              id: true,
              name: true,
              defaultImage: true,
              productCategory: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  //* if any of the cart items are out of stock, remove them from the cart
  // TODO: later notify the user that some of the items are out of stock

  const cartItemsToRemove = cartItems.filter(item => item.productVariant.stock === 0);
  if (cartItemsToRemove.length > 0) {
    await prisma.$transaction(
      cartItemsToRemove.map(item => {
        return prisma.cartItem.delete({
          where: {
            id: item.id,
          },
        });
      }),
    );

    cartItems = cartItems.filter(item => item.productVariant.stock > 0);
  }

  const totalPrice = cartItems
    .reduce((acc, item) => {
      return acc + item.productVariant.price * item.quantity;
    }, 0)
    .toFixed(2);

  const totalQuantity = cartItems.reduce((acc, item) => {
    return acc + item.quantity;
  }, 0);

  return {
    cartItems,
    totalPrice,
    total: totalQuantity,
  };
};

export const getCartItemsCount = async (cartId: number) => {
  const cartItems = await prisma.cartItem.findMany({
    where: {
      cartId,
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  const total = cartItems.reduce((acc, item) => {
    return acc + item.quantity;
  }, 0);

  return total;
};

export const clearCart = async (cartId: number) => {
  await prisma.cartItem.deleteMany({
    where: {
      cartId,
    },
  });
};

export const getUserCartId = async (userId: number) => {
  const cart = await prisma.cart.findFirst({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  return cart.id;
};
