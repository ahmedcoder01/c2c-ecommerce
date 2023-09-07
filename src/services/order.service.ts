/* eslint-disable no-await-in-loop */

// ! can a seller buy from himself?
import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import { cartService } from '.';
import HttpException from '../utils/http-exception';

// STEPS:
// 1. Create a new order
// 2. add each cart item to the order as a new order item and decrement the stock
// 3. delete the cart
// 4. create stripe checkout session

export const createOrderFromCart = async ({
  cartId,
  userId,
  shippingAddressId,
}: {
  cartId: number;
  userId: number;
  shippingAddressId: number;
}) => {
  const order = await prisma.$transaction(async tx => {
    const cart = await tx.cart.findUnique({
      where: {
        id: cartId,
      },
      select: {
        cartItems: {
          select: {
            quantity: true,
            productVariant: {
              select: {
                stock: true,
                id: true,
                price: true,
              },
            },
          },
        },
      },
    });
    if (!cart) {
      throw new HttpException(httpStatus.INTERNAL_SERVER_ERROR, 'Cart not found');
    }

    // if the cart is empty, throw an error
    if (!cart.cartItems.length) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Cart is empty');
    }

    const hasAnyOutOfStock = cart.cartItems.some(
      cartItem => cartItem.productVariant.stock < cartItem.quantity,
    );

    if (hasAnyOutOfStock) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Some products are out of stock');
    }

    // eslint-disable-next-line no-underscore-dangle
    const _order = await tx.order.create({
      data: {
        orderItems: {
          create: [
            ...cart.cartItems.map(cartItem => ({
              productVariant: {
                connect: {
                  id: cartItem.productVariant.id,
                },
              },
              quantity: cartItem.quantity,
              price: cartItem.productVariant.price,
            })),
          ],
        },
        shippingAddress: {
          connect: {
            id: shippingAddressId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },

        status: 'PENDING',
      },

      select: {
        id: true,
        orderItems: {
          select: {
            id: true,
            productVariant: {
              select: {
                id: true,
                name: true,
                description: true,
                productVariantImage: true,
                product: {
                  select: {
                    defaultImage: true,
                    name: true,
                    description: true,
                    productCategory: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            quantity: true,
            price: true,
          },
        },
        shippingAddress: {
          select: {
            address: true,
            phone: true,
          },
        },
        createdAt: true,
      },
    });

    // decrement stock
    for (const cartItem of cart.cartItems) {
      await tx.productVariant.update({
        where: {
          id: cartItem.productVariant.id,
        },
        data: {
          stock: {
            decrement: cartItem.quantity,
          },
        },
      });
    }

    // empty cart
    await tx.cartItem.deleteMany({
      where: {
        cartId,
      },
    });

    return _order;
  });

  return order;
};

export const createOrderFromProductVariant = async ({
  productVariantId,
  userId,
  shippingAddressId,
  quantity = 1,
}: {
  productVariantId: number;
  userId: number;
  shippingAddressId: number;
  quantity?: number;
}) => {
  const order = await prisma.$transaction(async tx => {
    const productVariant = await prisma.productVariant.findUnique({
      where: {
        id: productVariantId,
        stock: {
          gte: quantity,
        },
      },
      select: {
        id: true,
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
        stock: true,
        description: true,
        price: true,
        name: true,
        productVariantImage: true,
      },
    });

    if (!productVariant) {
      throw new Error('Product variant out of stock or not available');
    }

    // eslint-disable-next-line no-underscore-dangle
    const _order = await tx.order.create({
      data: {
        orderItems: {
          create: [
            {
              productVariant: {
                connect: {
                  id: productVariant.id,
                },
              },
              quantity,
              price: productVariant.price,
            },
          ],
        },
        shippingAddress: {
          connect: {
            id: shippingAddressId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },

        status: 'PENDING',
      },
    });

    // decrement stock
    await tx.productVariant.update({
      where: {
        id: productVariant.id,
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    return _order;
  });
};
