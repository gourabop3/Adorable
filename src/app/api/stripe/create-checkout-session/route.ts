import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/auth/stack-auth';
import { db } from '@/db/schema';
import { users } from '@/db/schema';
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

    const { priceId, successUrl, cancelUrl } = await req.json();

    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get or create user in database
    let dbUser;
    try {
      dbUser = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
      dbUser = dbUser[0];
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    if (!dbUser) {
      try {
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
        console.log('Created new user:', dbUser.id);
      } catch (insertError) {
        console.error('User creation error:', insertError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    // Create or get Stripe customer
    let customerId = dbUser.stripeCustomerId;
    if (!customerId) {
      try {
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
        
        console.log('Created Stripe customer:', customerId);
      } catch (stripeError) {
        console.error('Stripe customer creation error:', stripeError);
        return NextResponse.json({ error: 'Failed to create Stripe customer' }, { status: 500 });
      }
    }

    // Create checkout session
    try {
      const session = await stripe!.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: dbUser.id,
        },
      });

      console.log('Created checkout session:', session.id);
      return NextResponse.json({ sessionId: session.id });
    } catch (sessionError) {
      console.error('Checkout session creation error:', sessionError);
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}