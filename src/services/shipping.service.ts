import prisma from '../../prisma/prisma-client';

export const checkShippingAddressExistsOrThrow = async (
  shippingAddressId: number,
  userId: number,
) => {
  const shippingAddress = await prisma.shippingAddress.findUnique({
    where: {
      id: shippingAddressId,
      userId,
    },
  });

  if (!shippingAddress) {
    throw new Error('Shipping address not found');
  }
};
