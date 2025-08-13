import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/auth/stack-auth';
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

export async function POST(req: NextRequest) {
  // Build-time safety check
  if (process.env.NODE_ENV === 'production' && !stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const user = await getUser();
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, dbUser.id),
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Cancel subscription at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local database
    await db.update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id));

    console.log('Subscription canceled for user:', user.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}