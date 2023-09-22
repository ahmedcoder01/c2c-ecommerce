/* eslint-disable no-await-in-loop */

// ! can a seller buy from himself?
import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import { cartService, mailService } from '.';
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
* TO IMPLEMENT (for users):
- cancel order
- request refund
- review product
*/

export const finalizeOrder = async (orderId: number, userId: number) => {
  //* In a real application, this function should be called after the delivery service confirms that the package has been delivered
  /* STEPS:
  - mark order as "COMPLETED"
  - add the price to the seller's balance
  */

  // ATOMIC OPERATION
  const order = await prisma.$transaction(async tx => {
    // eslint-disable-next-line no-underscore-dangle
    const _order = await tx.order.findUnique({
      where: {
        id: orderId,
        user: {
          id: userId,
        },
      },
      select: {
        id: true,
        status: true,
        user: {
          select: {
            email: true,
          },
        },

        orderItems: {
          select: {
            id: true,
            price: true,
            quantity: true,

            productVariant: {
              select: {
                product: {
                  select: {
                    // sellerProfileId: true,
                    sellerProfile: {
                      select: {
                        user: {
                          select: {
                            email: true,
                          },
                        },
                        id: true,
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

    if (!_order) {
      throw new HttpException(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (_order.status !== 'CONFIRMED') {
      if (_order.status === 'COMPLETED') {
        throw new HttpException(httpStatus.BAD_REQUEST, 'Order was completed');
      }
      throw new HttpException(httpStatus.BAD_REQUEST, 'Order is not confirmed');
    }

    // mark order as completed
    await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: 'COMPLETED',
        deliveredAt: new Date(),
      },
    });

    // add the price to the seller's balance
    for (const orderItem of _order.orderItems) {
      await tx.sellerProfile.update({
        where: {
          id: orderItem.productVariant.product.sellerProfile?.id!,
        },
        data: {
          sellerBalance: {
            update: {
              balance: {
                increment: orderItem.price * orderItem.quantity,
              },

              logs: {
                create: {
                  amount: orderItem.price * orderItem.quantity,
                  order: {
                    connect: {
                      id: _order.id,
                    },
                  },
                  message: `Product purchase completed`,
                },
              },
            },
          },
        },
      });
    }

    return _order;
  });

  // send user email for confirmation
  await mailService.sendEmail({
    emails: [order.user.email],
    message: `Order #${order.id} has been completed successfully.
    Please leave a review for the products you bought
    `,

    subject: 'Order completed',
  });

  // send email to sellers
  await mailService.sendEmail({
    message: `Hello Seller!

    Order #${order.id} has been completed successfully.`,
    emails: order.orderItems.map(
      orderItem => orderItem.productVariant.product.sellerProfile!.user.email,
    ),

    subject: 'Order completed',
  });

  // TODO: maybe send email to sellers?
};

export const markOrderAsConfirmed = async (
  orderId: number,
  {
    paymentId,
  }: {
    paymentId: string;
  },
) => {
  // make sure to send a email to the user that the order is confirmed

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    select: {
      id: true,
      user: {
        select: {
          email: true,
        },
      },

      orderItems: {
        select: {
          productVariant: {
            select: {
              product: {
                select: {
                  sellerProfile: {
                    select: {
                      user: {
                        select: {
                          email: true,
                        },
                      },
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

  if (!order) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Order not found');
  }

  const updatedOrder = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status: 'CONFIRMED',

      paymentDetails: {
        create: {
          paymentId,
          paymentMethod: 'ANY',
          processorProvider: 'STRIPE',
        },
      },
    },

    select: {
      id: true,
      status: true,
    },
  });

  // send email to user
  await mailService.sendEmail({
    emails: [order.user.email],
    message: `Order #${order.id} has been confirmed. Please confirm the delivery when you receive the package`,
    subject: 'Order confirmed',
  });

  // send email to all sellers
  await mailService.sendEmail({
    message: `Hello Seller!
    
    Order #${order.id} has been confirmed. Please prepare the package for delivery`,
    emails: order.orderItems.map(
      orderItem => orderItem.productVariant.product.sellerProfile!.user.email,
    ),

    subject: 'Order confirmed',
  });

  return updatedOrder;
};

export const cancelOrder = async ({
  isSystemCall = false,
  orderId,
  userId,
}: {
  isSystemCall?: boolean;
  orderId: number;
  userId?: number;
}) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      status: 'PENDING',

      ...(!isSystemCall && userId
        ? {
            user: {
              id: userId,
            },
          }
        : {}),
    },
    select: {
      id: true,
      orderItems: {
        select: {
          id: true,
          quantity: true,
          productVariant: {
            select: {
              id: true,
              stock: true,
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
    // increment stock that was kept for the order
    for (const orderItem of order.orderItems) {
      await tx.productVariant.update({
        where: {
          id: orderItem.productVariant.id,
        },
        data: {
          stock: {
            increment: orderItem.quantity,
          },
        },
      });
    }

    // delete order
    await tx.order.update({
      where: {
        id: orderId,
      },

      data: {
        status: 'CANCELLED',
      },
    });
  });
};

export const requestRefund = async (
  orderItemId: number,
  userId: number,
  {
    reason,
  }: {
    reason?: string;
  },
) => {
  /**
   * STEPS:
   * - check if the order is completed
   * - check if the order is not already refunded
   * - check if the order is not already requested for refund
   * - check if the order was placed within the last 7 days from the order delivery
   */
  const ALLOWED_TIME_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days

  const { refund, orderItem } = await prisma.$transaction(async tx => {
    const item = await prisma.orderItem.findUnique({
      where: {
        id: orderItemId,
        order: {
          user: {
            id: userId,
          },

          deliveredAt: {
            // should be within the last 7 days from the order delivery
            gte: new Date(Date.now() - ALLOWED_TIME_THRESHOLD),
          },
        },
      },
      select: {
        productVariant: {
          select: {
            product: {
              select: {
                sellerProfile: {
                  select: {
                    user: {
                      select: {
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },

        order: {
          select: {
            status: true,
            id: true,
          },
        },

        refundRequest: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!item) {
      throw new HttpException(httpStatus.NOT_FOUND, 'Item not found or is not eligible for refund');
    }

    if (item.order.status !== 'COMPLETED') {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Order is not completed');
    }

    if (item.refundRequest?.id) {
      throw new HttpException(
        httpStatus.BAD_REQUEST,
        `Refund request already exists with id ${item.refundRequest.id}`,
      );
    }

    // create refund request
    const orderRefund = await tx.refundRequest.create({
      data: {
        orderItem: {
          connect: {
            id: orderItemId,
          },
        },
        reason: reason || 'No reason provided',
        status: 'PENDING',
      },

      select: {
        id: true,
      },
    });

    return {
      refund: orderRefund,
      orderItem: item,
    };
  });

  // send email to seller
  await mailService.sendEmail({
    emails: [orderItem.productVariant.product.sellerProfile!.user.email],
    message: `Hello Seller!

    Order #${orderItem.order.id} has been requested for refund.
    `,
    subject: 'Order refund request',
  });

  return refund;
};

export const listRefundRequests = async (userId: number) => {
  const refundRequests = await prisma.refundRequest.findMany({
    where: {
      orderItem: {
        order: {
          user: {
            id: userId,
          },
        },
      },
    },
    select: {
      id: true,
      reason: true,
      status: true,
      orderItem: {
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

  return refundRequests;
};

export const cancelRefundRequest = async (refundRequestId: number, userId: number) => {
  const refundRequest = await prisma.refundRequest.findUnique({
    where: {
      id: refundRequestId,
      orderItem: {
        order: {
          user: {
            id: userId,
          },
        },
      },
    },
    select: {
      id: true,
      status: true,
      orderItem: {
        select: {
          id: true,
          quantity: true,
          price: true,
          productVariant: {
            select: {
              id: true,
              stock: true,
            },
          },
        },
      },
    },
  });

  if (!refundRequest) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Refund request not found');
  }

  if (refundRequest.status !== 'PENDING' && refundRequest.status !== 'ACCEPTED') {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Refund request cannot be cancelled');
  }

  // ATOMIC OPERATION
  await prisma.$transaction(async tx => {
    // increment stock that was kept for the order

    // delete refund request
    await tx.refundRequest.update({
      where: {
        id: refundRequestId,
      },

      data: {
        status: 'CANCELLED',
      },
    });
  });
};
