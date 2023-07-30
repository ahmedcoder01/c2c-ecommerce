import { SellerProfile } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../prisma/prisma-client';
import { ExpressHandler, ExpressHandlerWithParams } from '../types';
import { sellerService } from '../services';
import HttpException from '../utils/http-exception';

// Seller CRUD

export const postRegister: ExpressHandler<{ name: string; phone: string }, SellerProfile> = async (
  req,
  res,
) => {
  const profile = await sellerService.register(res.locals.userId, req.body);

  res.status(httpStatus.CREATED).json(profile);
};

export const getProfile: ExpressHandler<unknown, SellerProfile> = async (req, res) => {
  await sellerService.checkExists(res.locals.userId);
  const profile = await sellerService.getProfile(res.locals.userId);

  res.json(profile!);
};

export const getSellerById: ExpressHandlerWithParams<{ id: number }, {}, SellerProfile> = async (
  req,
  res,
) => {
  const profile = await sellerService.getById(req.params.id);

  if (!profile) {
    throw new HttpException(httpStatus.NOT_FOUND, 'Seller not found');
  }

  res.json(profile);
};

export const deleteSeller: ExpressHandler<unknown, unknown> = async (req, res) => {
  await sellerService.checkExists(res.locals.userId);

  await sellerService.deleteProfile(res.locals.userId);

  res.status(httpStatus.NO_CONTENT).end();
};

// Seller Product CRUD
