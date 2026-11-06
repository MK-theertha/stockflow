import { Router } from 'express';

import {
  HttpError,
  assertObjectId,
  found,
  hasActiveSubscription,
  json,
  route,
} from '../../lib/api.js';
import { config } from '../../config.js';
import { addBillingPeriod } from '../../lib/dates.js';
import { CURRENCY, PLANS, getPlanPrice } from '@stockflow/shared/plans';
import { getStripe } from '../../lib/stripe.js';
import { checkoutSchema } from '../../lib/validators.js';
import { Order, Subscription, User } from '../../models/index.js';

const router = Router();

// Everything here must work without an active subscription, since it is how users get one.
const billingRoute = (handler) => route(handler, { subscription: false });

// Used by the dashboard layouts to check whether the user may enter.
router.post(
  '/active/:id',
  billingRoute(async ({ params, user }) => {
    if (params.id !== user._id) throw new HttpError(403, 'Unauthorized access');

    if (user.role === 'admin' || (await hasActiveSubscription(user._id))) {
      return json({ msg: true });
    }
    throw new HttpError(402, 'Subscription expired');
  })
);

router.get(
  '/billing/:id',
  billingRoute(async ({ params, user }) => {
    const userId = assertObjectId(params.id, 'user id');
    if (userId !== user._id && user.role !== 'admin') throw new HttpError(403, 'Forbidden');

    const subscription = await Subscription.findOne({ userId });
    return json(found(subscription, 'Subscription'));
  })
);

router.get(
  '/orders',
  billingRoute(async ({ user }) => {
    const orders = await Order.find({ userId: user._id }).sort({ createdAt: -1 });
    return json(orders);
  })
);

// Starts a Stripe checkout. The price always comes from the server-side plan table.
router.post(
  '/pricing',
  billingRoute(async ({ body, user }) => {
    const { plan, billingPeriod } = checkoutSchema.parse(body);
    const price = getPlanPrice(plan, billingPeriod);
    if (!price) throw new HttpError(400, 'Unknown plan');

    const checkout = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: { name: `${PLANS[plan].title} (${billingPeriod})` },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${config.clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.clientUrl}/cancel`,
      customer_email: user.email,
      metadata: { userId: user._id, plan, billing: billingPeriod },
    });

    return json({ id: checkout.url });
  })
);

// Called by the /success page after Stripe redirects back. Verifies the payment
// with Stripe and extends the subscription. Each checkout can be redeemed once.
router.get(
  '/pricing/success/:id',
  billingRoute(async ({ params, user }) => {
    const checkout = await getStripe().checkout.sessions.retrieve(params.id);

    if (checkout.payment_status !== 'paid') {
      throw new HttpError(402, 'Payment failed, please try again');
    }
    if (checkout.metadata?.userId !== user._id) {
      throw new HttpError(403, 'This payment belongs to another account');
    }
    if (await Order.exists({ transactionId: checkout.id })) {
      return json({ success: 'payment already verified' });
    }

    const amount = checkout.amount_total / 100;
    const billingPeriod = checkout.metadata.billing;

    // Record the order first: the unique transactionId stops a parallel request
    // from redeeming the same checkout twice.
    await Order.create({
      userId: user._id,
      transactionId: checkout.id,
      totalPrice: amount,
    });

    const now = new Date();
    const subscription = await Subscription.findOne({ userId: user._id });

    if (subscription) {
      // Renewing early extends from the current end date; otherwise start from today.
      const base = subscription.endDate > now ? subscription.endDate : now;
      subscription.endDate = addBillingPeriod(base, billingPeriod);
      subscription.price = amount;
      await subscription.save();
    } else {
      const created = await Subscription.create({
        userId: user._id,
        stripesubscriptionId: checkout.id,
        startDate: now,
        endDate: addBillingPeriod(now, billingPeriod),
        price: amount,
      });
      await User.findByIdAndUpdate(user._id, { subscription: created._id });
    }

    return json({ success: 'payment verified' });
  })
);

export default router;
