import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/auth/stack-auth';
import { db } from '@/db/schema';
import { users, creditTransactions } from '@/db/schema';
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

    const { creditPack, credits, successUrl, cancelUrl } = await req.json();

    if (!creditPack || !credits || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get or create user in database
    let dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
    });

    if (!dbUser) {
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
    }

    // Create or get Stripe customer
    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe!.customers.create({
        email: dbUser.email,
        name: dbUser.name,
        metadata: {
          userId: dbUser.id,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await db.update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, dbUser.id));
    }

    // Create checkout session for credit purchase
    const session = await stripe!.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Credits`,
              description: `Purchase ${credits} credits for AI app creation`,
            },
            unit_amount: getCreditPrice(credits) * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: dbUser.id,
        creditPack,
        credits: credits.toString(),
        type: 'credit_purchase',
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Credit purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

function getCreditPrice(credits: number): number {
  const pricing = {
    50: 4.99,
    100: 8.99,
    250: 19.99,
    500: 34.99,
  };
  return pricing[credits as keyof typeof pricing] || 0.10 * credits;
}