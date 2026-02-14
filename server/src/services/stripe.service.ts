import Stripe from 'stripe';
import { env } from '../config/env';
import { prisma } from '../config/database';

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export const stripeService = {
  async createCheckoutSession(organizationId: string, email: string) {
    const stripe = getStripe();
    if (!env.STRIPE_PRICE_ID) throw new Error('STRIPE_PRICE_ID not configured');

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new Error('Organization not found');

    // Find or create Stripe customer
    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const existingCustomers = await stripe.customers.list({ email, limit: 1 });
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          metadata: { organizationId },
        });
        customerId = customer.id;
      }
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: `${env.APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.APP_URL}/billing`,
      client_reference_id: organizationId,
    });

    return { url: session.url };
  },

  async handleWebhookEvent(event: Stripe.Event) {
    const stripe = getStripe();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.client_reference_id;
        if (!orgId) break;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        const periodEnd = subscription.items.data[0]?.current_period_end;

        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan: 'pro',
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            trialEndsAt: subscription.trial_end
              ? new Date(subscription.trial_end * 1000)
              : null,
            currentPeriodEnd: periodEnd
              ? new Date(periodEnd * 1000)
              : null,
          },
        });

        console.log('[Stripe] Organization upgraded to pro:', orgId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!org) break;

        let plan = 'pro';
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          plan = 'canceled';
        } else if (
          subscription.status === 'active' ||
          subscription.status === 'trialing'
        ) {
          plan = 'pro';
        } else if (subscription.status === 'past_due') {
          plan = 'past_due';
        }

        const periodEnd = subscription.items.data[0]?.current_period_end;

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan,
            currentPeriodEnd: periodEnd
              ? new Date(periodEnd * 1000)
              : null,
          },
        });

        console.log('[Stripe] Subscription updated:', { orgId: org.id, plan, status: subscription.status });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!org) break;

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: 'canceled',
            stripeSubscriptionId: null,
          },
        });

        console.log('[Stripe] Subscription canceled:', org.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as Record<string, unknown>).subscription as string
          || invoice.subscription_details?.metadata?.subscription_id;
        if (!subscriptionId) break;

        const org = await prisma.organization.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });
        if (!org) break;

        await prisma.organization.update({
          where: { id: org.id },
          data: { plan: 'past_due' },
        });

        console.log('[Stripe] Payment failed:', org.id);
        break;
      }
    }
  },

  async createPortalSession(stripeCustomerId: string) {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${env.APP_URL}/billing`,
    });
    return { url: session.url };
  },
};
