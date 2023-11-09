import { ShippingAddress } from '@prisma/client';
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

export const addShippingAddress = async (
  userId: number,
  shippingAddress: Pick<
    ShippingAddress,
    'address' | 'city' | 'country' | 'name' | 'isDefault' | 'phone'
  >,
) => {
  const oldDefaultShippingAddress = await prisma.shippingAddress.findFirst({
    where: {
      userId,
      isDefault: true,
    },
    select: {
      isDefault: true,
    },
  });

  const userHasDefaultShippingAddress = !!oldDefaultShippingAddress;

  return prisma.shippingAddress.create({
    data: {
      ...shippingAddress,

      isDefault: !userHasDefaultShippingAddress || shippingAddress.isDefault,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
};

export const listShippingAddressess = async (userId: number) => {
  return prisma.shippingAddress.findMany({
    where: {
      userId,
    },
  });
};

export const getShippingAddress = async (shippingAddressId: number, userId: number) => {
  await checkShippingAddressExistsOrThrow(shippingAddressId, userId);
  return prisma.shippingAddress.findUnique({
    where: {
      id: shippingAddressId,
      userId,
    },
  });
};

export const updateShippingAddress = async (
  shippingAddressId: number,
  userId: number,
  shippingAddress: Partial<
    Pick<ShippingAddress, 'address' | 'city' | 'country' | 'name' | 'isDefault' | 'phone'>
  >,
) => {
  await checkShippingAddressExistsOrThrow(shippingAddressId, userId);
  let userHasDefaultShippingAddress = false;

  if (shippingAddress.isDefault) {
    await prisma.shippingAddress.updateMany({
      where: {
        userId,
      },
      data: {
        isDefault: false,
      },
    });
  } else {
    const oldDefaultShippingAddress = await prisma.shippingAddress.findFirst({
      where: {
        userId,
        isDefault: true,
      },
      select: {
        isDefault: true,
      },
    });

    userHasDefaultShippingAddress = !!oldDefaultShippingAddress;
  }

  return prisma.shippingAddress.update({
    where: {
      id: shippingAddressId,
      userId,
    },
    data: {
      ...shippingAddress,
      isDefault: !userHasDefaultShippingAddress || shippingAddress.isDefault,
    },
  });
};

export const deleteShippingAddress = async (shippingAddressId: number, userId: number) => {
  await checkShippingAddressExistsOrThrow(shippingAddressId, userId);
  return prisma.shippingAddress.delete({
    where: {
      id: shippingAddressId,
      userId,
    },
  });
};

export const setDefaultShippingAddress = async (shippingAddressId: number, userId: number) => {
  await checkShippingAddressExistsOrThrow(shippingAddressId, userId);
  await prisma.shippingAddress.updateMany({
    where: {
      userId,
    },
    data: {
      isDefault: false,
    },
  });

  return prisma.shippingAddress.update({
    where: {
      id: shippingAddressId,
      userId,
    },
    data: {
      isDefault: true,
    },
  });
};
