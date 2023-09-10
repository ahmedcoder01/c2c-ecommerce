// SELLER SPECIFIC
import prisma from '../../../prisma/prisma-client';

export const listSellerOrders = async (sellerId: number) => {
  const ordersItems = await prisma.orderItem.findMany({
    where: {
      productVariant: {
        product: {
          sellerProfileId: sellerId,
        },
      },

      order: {
        status: 'CONFIRMED',
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
