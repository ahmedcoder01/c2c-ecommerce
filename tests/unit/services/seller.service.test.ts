import bcrypt from 'bcrypt';
import { SellerProfile } from '@prisma/client';
import config from '../../../src/config';
import { sellerService } from '../../../src/services';
import prismaMock from '../../prisma-mock';
import { UpdatedJwtPayload } from '../../../src/types/jwt.type';

describe('Seller Profile', () => {
  const seller: SellerProfile = {
    id: 1,
    name: 'test',
    phone: '08123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActivated: true,
    userId: 1,
  };
  describe('Register', () => {
    it('should create new seller profile', async () => {
      prismaMock.sellerProfile.create.mockResolvedValueOnce(seller);

      await expect(
        sellerService.register(seller.id, {
          name: seller.name,
          phone: seller.phone,
        }),
      ).resolves.toEqual(seller);

      expect(prismaMock.sellerProfile.create).toBeCalledTimes(1); // ensure create is called once
    });

    it('should throw error if seller profile already exists', async () => {
      const phone = '08123456789';
      prismaMock.sellerProfile.findUnique.mockResolvedValueOnce(seller);

      await expect(
        sellerService.register(seller.id, {
          name: seller.name,
          phone,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Get Profile', () => {
    it('should get seller profile', async () => {
      prismaMock.sellerProfile.findUnique.mockResolvedValueOnce(seller);

      await expect(sellerService.getProfile(seller.id)).resolves.toEqual(seller);

      expect(prismaMock.sellerProfile.findUnique).toBeCalledTimes(1);
    });
  });

  describe('Get By Id', () => {
    it('should get seller profile', async () => {
      prismaMock.sellerProfile.findUnique.mockResolvedValueOnce(seller);

      await expect(sellerService.getById(seller.id)).resolves.toEqual(seller);
    });
  });

  describe('Delete Profile', () => {
    it('should delete seller profile', async () => {
      prismaMock.sellerProfile.delete.mockResolvedValueOnce(seller);

      await sellerService.deleteProfile(seller.id);

      expect(prismaMock.sellerProfile.delete).toBeCalledTimes(1);
    });
  });

  describe('Check Exists Or Throw', () => {
    it('should throw error if seller profile does not exist', async () => {
      prismaMock.sellerProfile.findUnique.mockResolvedValueOnce(null);

      expect(sellerService.checkExistsOrThrow(seller.id)).rejects.toThrow(
        'Seller profile does not exist',
      );
    });
  });
});
