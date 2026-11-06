import Stripe from 'stripe';

import { config } from '../config.js';

let stripe;

// Created on first use so a missing key only fails the billing requests.
export function getStripe() {
  if (!config.stripeSecretKey) throw new Error('STRIPE_SECRET_KEY is not set');
  stripe ??= new Stripe(config.stripeSecretKey);
  return stripe;
}
