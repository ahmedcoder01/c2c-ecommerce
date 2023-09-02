// STRIPE PAYMENT SERVICE

import Stripe from 'stripe';
import prisma from '../../prisma/prisma-client';
import { stripe } from '../lib/payments';

export const generateOrderCheckoutSession = async (
  cartId: number,
  host: string,
  successUrl: string,
  cancelUrl: string,
) => {
  const cart = await prisma.cart.findUnique({
    where: {
      id: cartId,
    },
    select: {
      id: true,
      cartItems: {
        select: {
          productVariant: {
            select: {
              id: true,
              price: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  defaultImage: true,
                  productCategory: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          quantity: true,
        },
      },
    },
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.cartItems.map(
    cartItem => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: cartItem.productVariant.product.name!,
          images: [cartItem.productVariant.product.defaultImage!],
        },
        unit_amount: cartItem.productVariant.price,
      },
      quantity: cartItem.quantity,
    }),
  );

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${host}${successUrl}?cartId=${cart.id}`,
    cancel_url: `${host}${cancelUrl}`,

    metadata: {
      cartId: cart.id.toString(),
    },
  });

  return session;
};
