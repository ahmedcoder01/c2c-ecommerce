import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import logger from '../logger';
import ApiError from '../utils/http-exception';
import { mailService } from '.';

export const isAuctionExists = async (auctionId: string) => {
  const auction = await prisma.auction.findFirst({
    where: {
      id: auctionId,
    },

    select: {
      id: true,
    },
  });
  return !!auction;
};

export const getAuction = async (auctionId: string) => {
  const auction = await prisma.auction.findFirst({
    where: {
      id: auctionId,
    },
    select: {
      id: true,
      auctionStatus: true,
      auctionStartDate: true,
      auctionEndDate: true,
      minimumBidPrice: true,
      productVariant: {
        select: {
          id: true,
          product: {
            select: {
              id: true,
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
        select: {
          id: true,
          bidPrice: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  return auction;
};

export const bid = async ({
  auctionId,
  bidAmount,
  userId,
}: {
  auctionId: string;
  bidAmount: number;
  userId: string;
}) => {
  await prisma.$transaction(async tx => {
    const auction = await tx.auction.findFirst({
      where: {
        id: auctionId,
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

    if (auction.auctionBids[0]?.bidPrice >= bidAmount) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Bid amount is lower than or equal the highest bid',
      );
    }

    if (auction.minimumBidPrice > bidAmount) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Bid amount is lower than the minimum bid price');
    }

    const newBid = await tx.auctionBid.create({
      data: {
        bidPrice: bidAmount,
        userId,

        auctionId: auctionId,
      },
      select: {
        id: true,
      },
    });

    return newBid;
  });
};

export async function listNotEndedAuctions() {
  const auctions = await prisma.auction.findMany({
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
  return auctions;
}

export async function markBiddingProductAsStarted(auctionId: string) {
  try {
    const auction = await prisma.auction.update({
      where: {
        id: auctionId,
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

export async function endAuctionAndChooseWinner(auctionId: string) {
  const tx = await prisma.$transaction(async tx => {
    const auction = await tx.auction.update({
      where: {
        id: auctionId,
      },

      data: {
        auctionStatus: 'ENDED',

        productVariant: {
          update: {
            stock: {
              decrement: 1, // TODO: DECREMENT STOCK ON AUCTION START AND NOT ON END
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
      return { winner: null };
    }

    await tx.auction.update({
      where: {
        id: auctionId,
      },

      data: {
        winnerId: highestBid.user.id,
      },

      select: undefined,
    });

    // send email to the highest bidder to start the payment process
    const userE = mailService.sendEmail({
      emails: [highestBid.user.email],
      subject: 'You won the auction',
      message: `You won the auction for the product ${auction.productVariant.product.name} with the price ${highestBid.bidPrice}. Please folow
      the below link to start the payment process. \n\n Payment link: http://localhost:3000/auction-payment/${auctionId} \n\n
      Please note that if you do not pay within 24 hours, you will be banned from bidding in the future auctions.
      `,
    });

    const sellerE = mailService.sendEmail({
      emails: [auction.productVariant.product.sellerProfile?.user.email as string],
      subject: `Your product ${auction.productVariant.product.name} auction has ended`,
      message: `Your product ${auction.productVariant.product.name} auction has ended and  ${highestBid.user.email} had the highest bid with the price ${highestBid.bidPrice}. Please check your email for the buyer's contact information.
      We will notify you once the payment is done.`,
    });

    await Promise.all([userE, sellerE]);

    return { winner: highestBid.user };
  });

  return tx;
}
