import httpStatus from 'http-status';
import { ShippingAddress } from '@prisma/client';
import config from '../config';
import { shippingAddressService } from '../services';
import { ExpressHandler, ExpressHandlerWithParams } from '../types';
import HttpException from '../utils/http-exception';

export const createShippingAddress: ExpressHandler<
  {
    address: string;
    city: string;
    country: string;
    name: string;
    phone: string;
    isDefault: boolean;
  },
  {
    shippingAddress: any;
  }
> = async (req, res) => {
  const { address, city, country, name, phone, isDefault } = req.body;
  const { userId } = res.locals;

  const shippingAddress = await shippingAddressService.addShippingAddress(userId, {
    address,
    city,
    country,
    name,
    phone,
    isDefault,
  });

  res.status(httpStatus.CREATED).json({
    message: 'Shipping address created successfully',
    shippingAddress,
  });
};

export const listUserShippingAddresses: ExpressHandler<
  any,
  {
    shippingAddresses: any;
  }
> = async (req, res) => {
  const { userId } = res.locals;
  const shippingAddresses = await shippingAddressService.listShippingAddressess(userId);
  res.status(httpStatus.OK).json({
    message: 'Shipping addresses fetched successfully',
    shippingAddresses,
  });
};

export const getUserShippingAddress: ExpressHandlerWithParams<
  { shippingAddressId: number },
  any,
  {
    shippingAddress: any;
  }
> = async (req, res) => {
  const { userId } = res.locals;
  const { shippingAddressId } = req.params;
  const shippingAddress = await shippingAddressService.getShippingAddress(
    +shippingAddressId,
    userId,
  );
  res.status(httpStatus.OK).json({
    message: 'Shipping address fetched successfully',
    shippingAddress,
  });
};

export const updateShippingAddress: ExpressHandlerWithParams<
  { shippingAddressId: number },
  Partial<Pick<ShippingAddress, 'address' | 'city' | 'country' | 'name' | 'isDefault' | 'phone'>>,
  {
    shippingAddress: any;
  }
> = async (req, res) => {
  const { userId } = res.locals;
  const { shippingAddressId } = req.params;
  const { address, city, country, name, phone, isDefault } = req.body;
  const shippingAddress = await shippingAddressService.updateShippingAddress(
    shippingAddressId,
    userId,
    {
      address,
      city,
      country,
      name,
      phone,
      isDefault,
    },
  );
  res.status(httpStatus.OK).json({
    message: 'Shipping address updated successfully',
    shippingAddress,
  });
};

export const deleteShippingAddress: ExpressHandlerWithParams<
  { shippingAddressId: number },
  any,
  any
> = async (req, res) => {
  const { userId } = res.locals;
  const { shippingAddressId } = req.params;
  await shippingAddressService.deleteShippingAddress(+shippingAddressId, userId);
  res.status(httpStatus.OK).json({
    message: 'Shipping address deleted successfully',
  });
};
