import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import logger from '../logger';
import ApiError from '../utils/http-exception';

export const isAuctionProductExists = async (productId: number) => {
  const product = await prisma.auctionProduct.findFirst({
    where: {
      id: +productId,
    },

    select: {
      id: true,
    },
  });
  return !!product;
};

export const bid = async ({
  auctionId,
  bidAmount,
  userId,
}: {
  auctionId: number;
  bidAmount: number;
  userId: number;
}) => {
  await prisma.$transaction(async tx => {
    const auctionProduct = await tx.auctionProduct.findFirst({
      where: {
        id: +auctionId,
      },
      select: {
        id: true,
        auctionStatus: true,
        auctionStartDate: true,
        auctionEndDate: true,
        minimumBidPrice: true,

        auctionBids: {
          select: {
            id: true,
            bidPrice: true,
          },
          orderBy: {
            bidPrice: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!auctionProduct) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Auction product not found');
    }

    if (auctionProduct.auctionStatus === 'ENDED' || auctionProduct.auctionEndDate < new Date()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Auction has ended');
    } else if (auctionProduct.auctionStatus === 'PENDING') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Auction has not started yet');
    }

    if (auctionProduct.auctionBids[0]?.bidPrice > bidAmount) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Bid amount is lower than the highest bid');
    }

    if (auctionProduct.minimumBidPrice >= bidAmount) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Bid amount is lower than the minimum bid price');
    }

    const newBid = await tx.auctionBid.create({
      data: {
        bidPrice: bidAmount,
        userId,

        auctionProductId: +auctionId,
      },
      select: {
        id: true,
      },
    });

    return newBid;
  });
};

export const _sys = {
  async listNotEndedBiddingProducts() {
    const products = await prisma.auctionProduct.findMany({
      where: {
        auctionStatus: {
          in: ['PENDING', 'STARTED'],
        },
      },
      select: {
        id: true,
        auctionStartDate: true,
        auctionEndDate: true,
        auctionStatus: true,
      },
    });
    return products;
  },

  async markBiddingProductAsStarted(productId: number) {
    try {
      const product = await prisma.auctionProduct.update({
        where: {
          id: +productId,
        },
        data: {
          auctionStatus: 'STARTED',
        },

        select: undefined,
      });
    } catch (error) {
      logger.error("Couldn't mark bidding product as started. Could be deleted");
    }
  },

  async markBiddingProductAsEnded(productId: number) {
    try {
      const product = await prisma.auctionProduct.update({
        where: {
          id: +productId,
        },
        data: {
          auctionStatus: 'ENDED',
        },

        select: undefined,
      });
      // TODO: maybe detect the winner here?
    } catch (error) {
      logger.error("Couldn't mark bidding product as ended. Could be deleted");
    }
  },
};
