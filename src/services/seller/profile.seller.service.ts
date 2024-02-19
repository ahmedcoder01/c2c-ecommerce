import { SellerProfile } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../utils/http-exception';

export const checkExistsOrThrow = async (uid: string) => {
  const existingProfile = await prisma.sellerProfile.findUnique({
    where: {
      userId: uid,
    },
  });

  if (!existingProfile) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Seller profile does not exist');
  }
};

export const getOrThrow = async (uid: string) => {
  const existingProfile = await prisma.sellerProfile.findUnique({
    where: {
      userId: uid,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      isActivated: true,
    },
  });

  if (!existingProfile) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Seller profile does not exist');
  }

  return existingProfile;
};

export const register = async (
  uid: string,
  { name, phone }: Pick<SellerProfile, 'name' | 'phone'>,
) => {
  const existingProfile = await prisma.sellerProfile.findUnique({
    where: {
      userId: uid,
    },
  });

  if (existingProfile) {
    throw new HttpException(httpStatus.CONFLICT, 'Seller profile already exists');
  }

  const seller = await prisma.sellerProfile.create({
    data: {
      name,
      phone,
      isActivated: true,
      user: {
        connect: {
          id: uid,
        },
      },
      sellerBalance: {
        create: {
          balance: 0,
        },
      },
    },
  });

  return seller;
};

export const getProfile = async (uid: string) => {
  const profile = await prisma.sellerProfile.findUnique({
    where: {
      userId: uid,
    },
  });

  return profile;
};

export const getById = async (sellerId: string) => {
  const profile = await prisma.sellerProfile.findUnique({
    where: {
      id: sellerId,
    },
  });

  return profile;
};

export const deleteProfile = async (uid: string) => {
  await prisma.sellerProfile.delete({
    where: {
      userId: uid,
    },
  });
};

export const getBalance = async (
  sellerId: string,
  {
    includeLogs = true,
  }: {
    includeLogs?: boolean;
  },
) => {
  const balance = await prisma.sellerBalance.findUnique({
    where: {
      sellerProfileId: sellerId,
    },

    select: {
      balance: true,
      updatedAt: true,
      logs: includeLogs,
    },
  });

  return balance;
};
