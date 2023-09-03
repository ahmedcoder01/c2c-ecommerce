// STRIPE PAYMENT SERVICE

import Stripe from 'stripe';
import { Order } from '@prisma/client';
import prisma from '../../prisma/prisma-client';
import { stripe } from '../lib/payments';

interface OrderDetails {
  id: number;
  orderItems: {
    id: number;
    price: number;
    quantity: number;

    productVariant: {
      id: number;
      name: string;
      description: string | null;
      productVariantImage: string | null;
      product: {
        name: string;
        defaultImage: string | null;
        productCategory: {
          name: string;
        };
      };
    };
  }[];
  shippingAddress: {
    address: string | null;
    phone: string | null;
  };
  createdAt: Date;
}

export const generateOrderCheckoutSession = async ({
  orderDetails,
  successUrl,
  cancelUrl,
}: {
  orderDetails: OrderDetails;
  successUrl: string;
  cancelUrl: string;
}) => {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderDetails.orderItems.map(
    orderItem => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: (orderItem.productVariant.name || orderItem.productVariant.product.name)!,
          images: [
            (orderItem.productVariant.productVariantImage ||
              orderItem.productVariant.product.defaultImage)!,
          ],
        },
        unit_amount: orderItem.price,
      },
      quantity: orderItem.quantity,
    }),
  );

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${successUrl}?orderId=${orderDetails.id}`,
    cancel_url: `${cancelUrl}?orderId=${orderDetails.id}`,

    metadata: {
      orderId: orderDetails.id.toString(),
    },
  });

  return session;
};
