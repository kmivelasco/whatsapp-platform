import { env } from '../config/env';
import { prisma } from '../config/database';

const REBILL_BASE_URL = 'https://api.rebill.com/v3';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rebillFetch(path: string, options: RequestInit = {}): Promise<any> {
  if (!env.REBILL_API_KEY) {
    throw new Error('REBILL_API_KEY not configured');
  }

  const res = await fetch(`${REBILL_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.REBILL_API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[Rebill] API error ${res.status} on ${path}:`, errorBody);
    throw new Error(`Rebill API error: ${res.status} - ${errorBody}`);
  }

  return res.json();
}

export const rebillService = {
  async createCheckoutLink(organizationId: string, email: string, name?: string) {
    if (!env.REBILL_PLAN_ID) throw new Error('REBILL_PLAN_ID not configured');

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new Error('Organization not found');

    // Create a Payment Link for the plan
    const paymentLink = await rebillFetch('/payment-links', {
      method: 'POST',
      body: JSON.stringify({
        title: [
          { language: 'es', text: 'Spark CRM Pro' },
          { language: 'en', text: 'Spark CRM Pro' },
        ],
        description: [
          { language: 'es', text: 'Suscripcion mensual a Spark CRM' },
          { language: 'en', text: 'Monthly subscription to Spark CRM' },
        ],
        type: 'plan',
        plan: {
          id: env.REBILL_PLAN_ID,
        },
        paymentMethods: [
          {
            methods: ['card'],
            currency: 'ARS',
          },
        ],
        redirectUrls: {
          approved: `${env.APP_URL}/billing?status=approved&org=${organizationId}`,
          pending: `${env.APP_URL}/billing?status=pending&org=${organizationId}`,
          rejected: `${env.APP_URL}/billing?status=rejected&org=${organizationId}`,
        },
        prefilledFields: {
          customer: {
            email,
            fullName: name || '',
            language: 'es',
          },
        },
        isSingleUse: true,
        metadata: {
          organizationId,
        },
      }),
    });

    console.log('[Rebill] Payment link created:', paymentLink.id);

    return { url: paymentLink.url };
  },

  async handleWebhookEvent(event: RebillWebhookEvent) {
    const eventType = event.webhook?.event || event.event;

    console.log('[Rebill Webhook] Processing event:', eventType);

    switch (eventType) {
      case 'subscription.created': {
        const subscription = event.data;
        const organizationId = subscription.metadata?.organizationId
          || event.metadata?.organizationId;

        if (!organizationId) {
          console.warn('[Rebill] subscription.created without organizationId in metadata');
          break;
        }

        // Calculate next charge date as currentPeriodEnd
        const nextChargeDate = subscription.nextChargeDate
          ? new Date(subscription.nextChargeDate)
          : null;

        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            plan: 'pro',
            rebillCustomerId: event.customer?.id || null,
            rebillSubscriptionId: subscription.id,
            currentPeriodEnd: nextChargeDate,
          },
        });

        console.log('[Rebill] Organization upgraded to pro:', organizationId);
        break;
      }

      case 'subscription.updated': {
        const subscription = event.data;
        const org = await prisma.organization.findFirst({
          where: { rebillSubscriptionId: subscription.id },
        });
        if (!org) {
          console.warn('[Rebill] subscription.updated for unknown subscription:', subscription.id);
          break;
        }

        // Map Rebill subscription statuses to our plan
        let plan = 'pro';
        const status = subscription.status?.toLowerCase();

        if (status === 'active') {
          plan = 'pro';
        } else if (status === 'cancelled' || status === 'canceled') {
          plan = 'canceled';
        } else if (status === 'paused') {
          plan = 'canceled';
        } else if (status === 'defaulted') {
          plan = 'past_due';
        } else if (status === 'retrying') {
          plan = 'past_due';
        } else if (status === 'finished') {
          plan = 'canceled';
        }

        const nextChargeDate = subscription.nextChargeDate
          ? new Date(subscription.nextChargeDate)
          : null;

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan,
            currentPeriodEnd: nextChargeDate,
            ...(plan === 'canceled' ? { rebillSubscriptionId: null } : {}),
          },
        });

        console.log('[Rebill] Subscription updated:', { orgId: org.id, plan, status });
        break;
      }

      case 'payment.created': {
        const payment = event.data;
        const paymentStatus = payment.status?.toLowerCase();

        console.log('[Rebill] Payment event:', {
          paymentId: payment.id || payment.paymentId,
          status: paymentStatus,
          amount: payment.amount,
          currency: payment.currency,
        });

        // If payment failed, find the org and mark as past_due
        if (paymentStatus === 'rejected' || paymentStatus === 'failed') {
          const subscriptionId = payment.subscriptionId;
          if (subscriptionId) {
            const org = await prisma.organization.findFirst({
              where: { rebillSubscriptionId: subscriptionId },
            });
            if (org) {
              await prisma.organization.update({
                where: { id: org.id },
                data: { plan: 'past_due' },
              });
              console.log('[Rebill] Payment failed, org marked past_due:', org.id);
            }
          }
        }
        break;
      }

      case 'payment.updated': {
        const payment = event.data;
        const paymentStatus = payment.status?.toLowerCase();

        // Handle payment status updates (e.g., approved after pending)
        if (paymentStatus === 'approved' && payment.subscriptionId) {
          const org = await prisma.organization.findFirst({
            where: { rebillSubscriptionId: payment.subscriptionId },
          });
          if (org && org.plan !== 'pro') {
            await prisma.organization.update({
              where: { id: org.id },
              data: { plan: 'pro' },
            });
            console.log('[Rebill] Payment approved, org reactivated:', org.id);
          }
        }
        break;
      }

      default:
        console.log('[Rebill Webhook] Unhandled event type:', eventType);
    }
  },

  async cancelSubscription(rebillSubscriptionId: string) {
    return rebillFetch(`/subscriptions/${rebillSubscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' }),
    });
  },
};

// Type definitions for Rebill webhook payloads
interface RebillWebhookEvent {
  event?: string;
  data: {
    id?: string;
    paymentId?: string;
    status?: string;
    amount?: number;
    currency?: string;
    nextChargeDate?: string;
    lastChargeDate?: string;
    frequency?: { period: string; count: number };
    billingCycles?: { total: number; current: number; remaining: number };
    subscriptionId?: string;
    metadata?: Record<string, string>;
  };
  organization?: {
    id: string;
  };
  customer?: {
    id?: string;
    email?: string;
    phone?: string;
  };
  webhook?: {
    id: string;
    event: string;
    url: string;
    logId?: string;
  };
  metadata?: Record<string, string>;
}
