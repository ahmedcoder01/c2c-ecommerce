import { ProductVariant, VariationOption } from '@prisma/client';
import prismaMock from '../../prisma-mock';
import { productService } from '../../../src/services';
import { ProductRequestVariant } from '../../../src/services/product.seller.service';

describe('Product Variants', () => {
  const duplicateVariants = [
    {
      id: 1,
      name: 'test2',
      value: 'test2',
      variation: {
        id: 1,
        name: 'test2',
      },
    },
  ];

  const newProductVariant: ProductRequestVariant = {
    imageUrl: 'test',
    name: 'test',
    price: 1,
    stock: 1,

    variationOptions: duplicateVariants,
  };

  const exisitingProductVariant = {
    createdAt: new Date(),
    description: 'test',
    id: 1,
    name: 'test',
    price: 1,
    productId: 1,
    quantity: 1,
    productVariantImage: '',
    updatedAt: new Date(),

    variationOptions: duplicateVariants,
  };

  it('should throw error if variant already exists', async () => {
    prismaMock.productVariant.findMany.mockResolvedValue([exisitingProductVariant]);
    // @ts-ignore
    prismaMock.variation.upsert.mockResolvedValue({ id: 1 });
    // @ts-ignore
    prismaMock.variationOption.findFirst.mockResolvedValue({ id: 1 });
    await expect(productService.createProductVariant(1, newProductVariant)).rejects.toThrowError(
      'Product variant already exists',
    );
  });
});
