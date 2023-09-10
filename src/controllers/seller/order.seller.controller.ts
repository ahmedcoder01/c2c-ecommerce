import { Product, ProductVariant, SellerProfile } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../../prisma/prisma-client';
import { ExpressHandler, ExpressHandlerWithParams } from '../../types';
import { sellerOrderService } from '../../services';
import { ProductRequestVariant } from '../../services/seller/product.seller.service';
import config from '../../config';
import HttpException from '../../utils/http-exception';

export const getSellerOrders: ExpressHandler<
  any,
  {
    orders: any;
  }
> = async (req, res) => {
  const { sellerId } = res.locals;
  const orders = await sellerOrderService.listSellerOrders(sellerId);
  res.status(httpStatus.OK).json({
    message: 'Orders fetched successfully',
    orders,
  });
};
