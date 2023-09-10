/* eslint-disable no-await-in-loop */

// ! can a seller buy from himself?
import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import { cartService } from '.';
import HttpException from '../utils/http-exception';

// USER SPECIFIC

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

//! temporary: will be removed when payment webhook is implemented
export const confirmOrder = async (orderId: number, userId: number) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,

      user: {
        id: userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!order) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Order not found');
  }

  const updatedOrder = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: 'CONFIRMED',
    },

    select: {
      id: true,
      status: true,
    },
  });

  return updatedOrder;
};

export const listUserOrders = async (userId: number) => {
  const orders = await prisma.order.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      shippingAddress: {
        select: {
          address: true,
          city: true,
          country: true,
          phone: true,
        },
      },
      orderItems: {
        select: {
          id: true,
          quantity: true,
          price: true,
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
        },
      },
    },
  });

  return orders;
};

/*
TO IMPLEMENT (for users):
- cancel order
- request refund
- review product
*/

// SYSTEM SPECIFIC

export const finalizeOrder = async (orderId: number) => {
  /* STEPS:
  - mark order as "COMPLETED"
  - add the price to the seller's balance
  */

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    select: {
      id: true,

      orderItems: {
        select: {
          id: true,
          price: true,
          quantity: true,

          productVariant: {
            select: {
              product: {
                select: {
                  sellerProfileId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Order not found');
  }

  // ATOMIC OPERATION
  await prisma.$transaction(async tx => {
    // mark order as completed
    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: 'COMPLETED',
      },
    });

    // add the price to the seller's balance
    for (const orderItem of order.orderItems) {
      await tx.sellerProfile.update({
        where: {
          id: orderItem.productVariant.product.sellerProfileId!,
        },
        data: {
          sellerBalance: {
            update: {
              balance: {
                increment: orderItem.price * orderItem.quantity,
              },
            },
          },
        },
      });
    }
  });
};
