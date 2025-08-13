import { NextResponse } from 'next/server';
import { getUser } from '@/auth/stack-auth';
import { db } from '@/db/schema';
import { users, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  // Build-time safety check
  if (process.env.NODE_ENV === 'production' && !process.env.STACK_SECRET_SERVER_KEY) {
    return NextResponse.json({ error: 'Stack Auth not configured' }, { status: 500 });
  }

  try {
    let user;
    try {
      user = await getUser();
    } catch (error) {
      // User not authenticated - return 401 without logging as error
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Billing API: Fetching data for user:', user.userId);

    // Get user data
    let dbUser;
    try {
      dbUser = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
      dbUser = dbUser[0];
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    console.log('Billing API: Found user in database:', dbUser ? {
      id: dbUser.id,
      plan: dbUser.plan,
      credits: dbUser.credits,
      updatedAt: dbUser.updatedAt
    } : 'User not found');

    if (!dbUser) {
      try {
        console.log('Billing API: Creating new user with 50 free credits');
        // Create new user with 50 free credits
        const newUser = await db.insert(users).values({
          id: user.userId,
          email: user.email || `user-${user.userId}@example.com`,
          name: user.name || 'User',
          image: user.image || '',
          credits: 50,
          plan: 'free',
        }).returning();

        dbUser = newUser[0];
        console.log('Billing API: New user created:', {
          id: dbUser.id,
          plan: dbUser.plan,
          credits: dbUser.credits
        });
      } catch (insertError) {
        console.error('Database error creating user:', insertError);
        return NextResponse.json({ error: 'Database temporarily unavailable' }, { status: 503 });
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User data unavailable' }, { status: 503 });
    }

    // Get subscription data
    let subscription;
    try {
      subscription = await db.select().from(subscriptions).where(eq(subscriptions.userId, dbUser.id)).limit(1);
      subscription = subscription[0];
    } catch (dbError) {
      console.error('Database subscription query error:', dbError);
      subscription = null; // Continue without subscription data
    }

    console.log('Billing API: Found subscription:', subscription ? {
      id: subscription.id,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripeSubscriptionId
    } : 'No subscription found');

    const responseData = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        credits: dbUser.credits,
        plan: dbUser.plan,
        stripeCustomerId: dbUser.stripeCustomerId,
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      } : null,
    };

    console.log('Billing API: Returning data:', {
      userId: responseData.user.id,
      plan: responseData.user.plan,
      credits: responseData.user.credits,
      hasSubscription: !!responseData.subscription
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}