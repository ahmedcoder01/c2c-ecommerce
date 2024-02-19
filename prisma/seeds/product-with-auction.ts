import 'dotenv/config';
import prisma from '../prisma-client';
import logger from '../../src/logger';

(async () => {
  let category = await prisma.productCategory.findFirst({
    where: {
      name: 'CLOTHING',
    },
  });
  if (!category) {
    category = await prisma.productCategory.create({
      data: {
        name: 'CLOTHING',
      },
    });
  }

  const product = await prisma.product.create({
    data: {
      name: 'Cotton T-shirt',
      description: 'Cotton T-shirt description',
      productCategory: {
        connect: {
          id: category.id,
        },
      },
      defaultImage: 'product default image',
      sellerProfile: {
        connect: { id: 2 },
      },
    },
  });
  logger.info('Product: ', product);

  const productVariant = await prisma.productVariant.create({
    data: {
      name: 'product variant name',
      price: 100,
      stock: 100,
      product: {
        connect: {
          id: product.id,
        },
      },
      hasAuctionOption: true,
      auction: {
        create: {
          // after 1 mins
          auctionStartDate: new Date(Date.now() + 1 * 60 * 1000),
          auctionEndDate: new Date(Date.now() + 5 * 60 * 1000), // for 5 mins
          minimumBidPrice: 100, // minimum bid price
        },
      },
    },

    include: {
      auction: true,
    },
  });
  logger.info('Product Variant: ', productVariant);

  logger.info(
    'Auction will start after 1 min and end after 5 mins. Minimum bid price is 100. Auction id: ',
    productVariant.auction?.id,
  );
})();
