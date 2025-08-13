import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/schema';
import { users, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

// Only initialize Stripe if not in build time
const stripe = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development'
  ? new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

export async function POST(req: NextRequest) {
  // Build-time safety check
  if (process.env.NODE_ENV === 'production' && !stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeletion(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.Invoice);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const dbUser = await db.query.users.findFirst({
      where: eq(users.stripeCustomerId, customerId),
    });

    if (!dbUser) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Update or create subscription
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, subscription.id),
    });

    if (existingSubscription) {
      await db.update(subscriptions)
        .set({
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existingSubscription.id));
    } else {
      await db.insert(subscriptions).values({
        id: crypto.randomUUID(),
        userId: dbUser.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
    }

    // Update user plan
    const plan = subscription.status === 'active' ? 'pro' : 'free';
    await db.update(users)
      .set({ plan, updatedAt: new Date() })
      .where(eq(users.id, dbUser.id));

    console.log('Subscription updated for user:', dbUser.id, 'Plan:', plan);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionDeletion(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const dbUser = await db.query.users.findFirst({
      where: eq(users.stripeCustomerId, customerId),
    });

    if (!dbUser) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Update subscription status
    await db.update(subscriptions)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    // Update user plan to free
    await db.update(users)
      .set({ plan: 'free', updatedAt: new Date() })
      .where(eq(users.id, dbUser.id));

    console.log('Subscription canceled for user:', dbUser.id);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handlePaymentSuccess(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      await handleSubscriptionChange(subscription);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      await handleSubscriptionChange(subscription);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    if (session.metadata?.type === 'credit_purchase') {
      const userId = session.metadata.userId;
      const credits = parseInt(session.metadata.credits || '0');
      
      if (userId && credits > 0) {
        // Add credits to user
        await db.update(users)
          .set({ 
            credits: db.raw(`credits + ${credits}`),
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));

        // Record credit transaction
        await db.insert(creditTransactions).values({
          userId,
          amount: credits,
          description: `Purchased ${credits} credits`,
          type: 'purchase',
          stripePaymentIntentId: session.payment_intent as string,
        });

        console.log(`Added ${credits} credits to user ${userId}`);
      }
    }
  } catch (error) {
    console.error('Error handling checkout session completion:', error);
  }
}