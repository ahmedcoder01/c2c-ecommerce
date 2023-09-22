import httpStatus from 'http-status';
import Stripe from 'stripe';
import config from '../config';
import { stripe } from '../lib/payments';
import { ExpressHandlerWithParams } from '../types';
import HttpException from '../utils/http-exception';
import { orderService } from '../services';
import logger from '../logger';

interface StripeEventWithMetadata extends Stripe.Event {
  data: {
    object: {
      id: string;
      metadata: {
        orderId: string;
      };
    };
  };
}

export const stripeWebhooks: ExpressHandlerWithParams<
  { orderId: number },
  any,
  {
    received: boolean;
  }
> = async (req, res) => {
  // FIXME: the problem is that express parses JSON but we need the raw body
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    throw new HttpException(httpStatus.BAD_REQUEST, 'Missing signature');
  }

  let event;

  try {
    event = (await stripe.webhooks.constructEventAsync(
      // @ts-ignore
      req.rawBody,
      sig,
      config.variables.stripeWebhooksEndpointSecret,
    )) as StripeEventWithMetadata;
  } catch (err: any) {
    throw new HttpException(httpStatus.BAD_REQUEST, `Webhook Error: ${err.message}`);
  }

  // const order = await orderService.markOrderAsConfirmed(+orderId);

  switch (event.type) {
    case 'checkout.session.completed':
      orderService.markOrderAsConfirmed(+event.data.object.metadata.orderId, {
        paymentId: event.data.object.id,
      });
      break;
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed':
      orderService.cancelOrder({
        isSystemCall: true,
        orderId: +event.data.object.metadata.orderId,
      });
      break;
    default:
      logger.info(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  return res.json({ received: true });
};
