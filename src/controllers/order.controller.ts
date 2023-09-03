import config from '../config';
import { cartService, orderService, paymentService, shippingService } from '../services';
import { ExpressHandler } from '../types';

export const createOrderFromCart: ExpressHandler<
  { shippingAddressId: number },
  {
    sessionId: string;
  }
> = async (req, res) => {
  const { shippingAddressId } = req.body;
  const { userId } = res.locals;

  await shippingService.checkShippingAddressExistsOrThrow(shippingAddressId, userId);
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

  res.json({ sessionId: session.id });

  // TODO: THEN HANDLE WEBHOOKS
};
