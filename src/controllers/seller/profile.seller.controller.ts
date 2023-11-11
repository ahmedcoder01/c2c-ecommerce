import { SellerProfile } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../../prisma/prisma-client';
import { ExpressHandler, ExpressHandlerWithParams } from '../../types';
import { authService, sellerService } from '../../services';
import HttpException from '../../utils/http-exception';

// Seller CRUD

export const postRegister: ExpressHandler<{ name: string; phone: string }, SellerProfile> = async (
  req,
  res,
) => {
  const profile = await sellerService.register(req.userId, req.body);

  res.status(httpStatus.CREATED).json(profile);
};

export const getProfile: ExpressHandler<unknown, SellerProfile> = async (req, res) => {
  await sellerService.checkExistsOrThrow(req.userId);
  const profile = await sellerService.getProfile(req.userId);

  res.json(profile!);
};

export const getSellerById: ExpressHandlerWithParams<{ sellerId: number }, {}, SellerProfile> =
  async (req, res) => {
    const profile = await sellerService.getById(+req.params.sellerId);

    if (!profile) {
      throw new HttpException(httpStatus.NOT_FOUND, 'Seller not found');
    }

    res.json(profile);
  };

export const deleteSeller: ExpressHandler<unknown, unknown> = async (req, res) => {
  await sellerService.checkExistsOrThrow(req.userId);

  await sellerService.deleteProfile(req.userId);

  res.status(httpStatus.NO_CONTENT).end();
};

// TODO: the balance controllers should be in a separate file (later)
export const getBalanceWithLogs: ExpressHandlerWithParams<{}, unknown, { balanceDetails: any }> =
  async (req, res) => {
    const { sellerId } = req;
    const { includeLogs = true } = req.query;

    const balanceDetails = await sellerService.getBalance(sellerId, {
      includeLogs,
    });

    res.json({
      balanceDetails,
    });
  };

// Seller Product CRUD
