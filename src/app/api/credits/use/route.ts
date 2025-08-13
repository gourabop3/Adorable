import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/auth/stack-auth';
import { db } from '@/db/schema';
import { users, creditTransactions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credits, description, appId } = await req.json();

    if (!credits || credits <= 0) {
      return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 });
    }

    // Get user's current credit balance
    let dbUser;
    try {
      dbUser = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
      dbUser = dbUser[0];
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.credits < credits) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        currentCredits: dbUser.credits,
        requiredCredits: credits
      }, { status: 400 });
    }

    // Deduct credits from user
    await db.update(users)
      .set({ 
        credits: dbUser.credits - credits,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.userId));

    // Record credit transaction
    await db.insert(creditTransactions).values({
      userId: user.userId,
      amount: -credits, // Negative amount for usage
      description: description || `Used ${credits} credits`,
      type: 'usage',
      metadata: appId ? { appId } : undefined,
    });

    // Get updated credit balance
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, user.userId),
    });

    return NextResponse.json({ 
      success: true,
      creditsUsed: credits,
      remainingCredits: updatedUser?.credits || 0,
      message: `Successfully used ${credits} credits`
    });

  } catch (error) {
    console.error('Credit usage error:', error);
    return NextResponse.json(
      { error: 'Failed to process credit usage' },
      { status: 500 }
    );
  }
}