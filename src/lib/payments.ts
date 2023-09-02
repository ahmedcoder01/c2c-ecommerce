import Stripe from 'stripe';
import config from '../config';

const stripe = new Stripe(config.variables.stripeSecretKey, {
  apiVersion: '2023-08-16',
});

export { stripe };
