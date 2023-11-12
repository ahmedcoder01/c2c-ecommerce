import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import logger from '../logger';
import ApiError from '../utils/http-exception';
import { mailService } from '.';

export const isAuctionExists = async (auctionId: number) => {
  const auction = await prisma.auction.findFirst({
    where: {
      id: +auctionId,
    },

    select: {
      id: true,
    },
  });
  return !!auction;
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
    const auction = await tx.auction.findFirst({
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

    if (!auction) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Auction not found');
    }

    if (auction.auctionStatus === 'ENDED' || auction.auctionEndDate < new Date()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Auction has ended');
    } else if (auction.auctionStatus === 'PENDING') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Auction has not started yet');
    }

    if (auction.auctionBids[0]?.bidPrice > bidAmount) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Bid amount is lower than the highest bid');
    }

    if (auction.minimumBidPrice >= bidAmount) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Bid amount is lower than the minimum bid price');
    }

    const newBid = await tx.auctionBid.create({
      data: {
        bidPrice: bidAmount,
        userId,

        auctionId: +auctionId,
      },
      select: {
        id: true,
      },
    });

    return newBid;
  });
};

export async function listNotEndedAuctions() {
  const products = await prisma.auction.findMany({
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
}

export async function markBiddingProductAsStarted(auctionId: number) {
  try {
    const auction = await prisma.auction.update({
      where: {
        id: +auctionId,
      },
      data: {
        auctionStatus: 'STARTED',
      },

      select: undefined,
    });
  } catch (error) {
    logger.error("Couldn't mark bidding as started. Could be deleted");
  }
}

export async function endAuctionAndChooseWinner(auctionId: number) {
  await prisma.$transaction(async tx => {
    const auction = await tx.auction.update({
      where: {
        id: +auctionId,
      },

      data: {
        auctionStatus: 'ENDED',

        productVariant: {
          update: {
            stock: {
              decrement: 1,
            },
          },
        },
      },

      select: {
        productVariant: {
          select: {
            id: true,
            product: {
              select: {
                name: true,
                sellerProfile: {
                  select: {
                    id: true,
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

        auctionBids: {
          take: 1,
          orderBy: {
            bidPrice: 'desc',
          },
          select: {
            id: true,
            bidPrice: true,
            user: {
              select: {
                email: true,
                id: true,
              },
            },
          },
        },
      },
    });

    const highestBid = auction.auctionBids[0];
    if (!highestBid) {
      await mailService.sendEmail({
        emails: [auction.productVariant.product.sellerProfile?.user.email as string],
        subject: 'Your auction has ended without any bids',
        message: `Your product ${auction.productVariant.product.name} has not been sold. Please check your auction settings.`,
      });
      return;
    }

    await tx.auction.update({
      where: {
        id: highestBid.id,
      },

      data: {
        winnerId: highestBid.user.id,
      },

      select: undefined,
    });

    const shippingAddresess = await tx.shippingAddress.findMany({
      where: {
        userId: highestBid.user.id,
      },

      select: {
        id: true,
        isDefault: true,
      },
    });

    const chosenAddress =
      shippingAddresess.find(address => address.isDefault) ?? shippingAddresess[0];

    const order = await tx.order.create({
      data: {
        userId: highestBid.user.id,
        orderItems: {
          create: {
            productVariantId: auction.productVariant.id,
            quantity: 1,
            price: highestBid.bidPrice,
          },
        },
        shippingAddressId: chosenAddress.id,
      },
      select: {
        id: true,
      },
    });

    // send email to the highest bidder and the seller
    const userE = mailService.sendEmail({
      emails: [highestBid.user.email],
      subject: 'You won the auction',
      message: `You won the auction for the product ${auction.productVariant.product.name} with the price ${highestBid.bidPrice}. Please pay for the product to get it shipped to you.`,
    });

    const sellerE = mailService.sendEmail({
      emails: [auction.productVariant.product.sellerProfile?.user.email as string],
      subject: 'Your product has been sold',
      message: `Your product ${auction.productVariant.product.name} has been sold for the price ${highestBid.bidPrice}. Please ship the product to the buyer.`,
    });

    await Promise.all([userE, sellerE]);
  });
}
