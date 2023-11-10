import httpStatus from 'http-status';
import config from '../config';
import { cartService, orderService, paymentService, shippingAddressService } from '../services';
import { ExpressHandler, ExpressHandlerWithParams } from '../types';
import HttpException from '../utils/http-exception';
import { stripe } from '../lib/payments';

export const createOrderFromCart: ExpressHandler<
  { shippingAddressId: number },
  {
    session: any;
  }
> = async (req, res) => {
  const { shippingAddressId } = req.body;
  const { userId } = res.locals;

  await shippingAddressService.checkShippingAddressExistsOrThrow(shippingAddressId, userId);
  const cartId = await cartService.getUserCartId(userId);

  // create order
  const order = await orderService.createOrderFromCart({
    userId,
    shippingAddressId,
    cartId,
  });
  // create checkout session
  const session = await paymentService.generateOrderCheckoutSession({
    successUrl: config.variables.stripeSuccessUrl,
    cancelUrl: config.variables.stripeCancelUrl,
    orderDetails: order,
  });

  res.json({
    session: {
      id: session.id,
      url: session.url,
    },
  });

  // TODO: THEN HANDLE WEBHOOKS
};

export const listUserOrders: ExpressHandler<
  any,
  {
    orders: any;
  }
> = async (req, res) => {
  const { userId } = res.locals;
  const orders = await orderService.listUserOrders(userId);
  res.status(httpStatus.OK).json({
    message: 'Orders fetched successfully',
    orders,
  });
};

//* TEMP until using webhooks

export const completeOrderAfterDelivery: ExpressHandlerWithParams<{ orderId: number }, {}, {}> =
  async (req, res) => {
    const { orderId } = req.params;
    const { userId } = res.locals;

    await orderService.finalizeOrder(+orderId, userId);

    res.status(httpStatus.OK).json({
      message: 'Order completed',
    });
  };
