import asyncHandler from 'express-async-handler';
import { Router, raw } from 'express';
import validate from '../middlewares/validation.middleware';
import { paymentsWebhookController } from '../controllers';

const paymentsWebhooks = Router();

paymentsWebhooks.post(
  '/webhooks/payments',
  raw({ type: 'application/json' }),
  asyncHandler(paymentsWebhookController.stripeWebhooks),
);

export default paymentsWebhooks;
