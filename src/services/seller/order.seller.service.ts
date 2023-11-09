// SELLER SPECIFIC
import prisma from '../../../prisma/prisma-client';

export const listSellerOrders = async (sellerId: number, active?: boolean) => {
  const ordersItems = await prisma.orderItem.findMany({
    where: {
      productVariant: {
        product: {
          sellerProfileId: sellerId,
        },
      },

      order: {
        status: active ? 'CONFIRMED' : 'COMPLETED',
      },
    },

    select: {
      id: true,
      quantity: true,
      price: true,
      order: {
        select: {
          id: true,
          createdAt: true,
          shippingAddress: {
            select: {
              address: true,
              city: true,
              country: true,
              phone: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
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
  });

  return ordersItems;
};

export const listSellerRefundRequests = async (sellerId: number) => {
  const refundRequests = await prisma.refundRequest.findMany({
    where: {
      orderItem: {
        productVariant: {
          product: {
            sellerProfileId: sellerId,
          },
        },
      },
    },
    select: {
      id: true,
      createdAt: true,
      reason: true,
      orderItem: {
        select: {
          id: true,
        },
      },
    },
  });

  return refundRequests;
};

export const approveRefundRequest = async (refundRequestId: number) => {
  const refundRequest = await prisma.refundRequest.update({
    where: {
      id: refundRequestId,
    },
    data: {
      status: 'APPROVED',
    },
    select: {
      id: true,
    },
  });
};

export const rejectRefundRequest = async (refundRequestId: number) => {
  const refundRequest = await prisma.refundRequest.update({
    where: {
      id: refundRequestId,
    },
    data: {
      status: 'REJECTED',
    },
    select: {
      id: true,
    },
  });
};
