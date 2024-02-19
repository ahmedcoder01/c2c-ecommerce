import httpStatus from 'http-status';
import config from '../config';
import { orderService } from '../services';
import { ExpressHandler, ExpressHandlerWithParams } from '../types';
import HttpException from '../utils/http-exception';

export const createOrderFromCart: ExpressHandler<
  { shippingAddressId: string },
  {
    session: any;
    order: any;
  }
> = async (req, res) => {
  const { shippingAddressId } = req.body;
  const { userId } = req;

  // create order
  const { order, session } = await orderService.createOrderFromCart({
    userId,
    shippingAddressId,
  });

  res.json({
    session: {
      id: session.id,
      url: session.url,
    },

    order,
  });

  // TODO: THEN HANDLE WEBHOOKS
};

export const listUserOrders: ExpressHandler<
  any,
  {
    orders: any;
  }
> = async (req, res) => {
  const { userId } = req;
  const orders = await orderService.listUserOrders(userId);
  res.status(httpStatus.OK).json({
    message: 'Orders fetched successfully',
    orders,
  });
};

//* TEMP until using webhooks

export const completeOrderAfterDelivery: ExpressHandlerWithParams<{ orderId: string }, {}, {}> =
  async (req, res) => {
    const { orderId } = req.params;
    const { userId } = req;

    await orderService.finalizeOrder(orderId, userId);

    res.status(httpStatus.OK).json({
      message: 'Order completed',
    });
  };
