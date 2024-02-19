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
    },
  });
  logger.info('Product Variant: ', productVariant);
})();
