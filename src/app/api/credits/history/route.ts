import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/auth/stack-auth';
import { db } from '@/db/schema';
import { creditTransactions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's credit transactions, ordered by most recent first
    let transactions;
    try {
      transactions = await db.select().from(creditTransactions)
        .where(eq(creditTransactions.userId, user.userId))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(100); // Limit to last 100 transactions
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      transactions: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        description: t.description,
        type: t.type,
        createdAt: t.createdAt,
        metadata: t.metadata,
      }))
    });

  } catch (error) {
    console.error('Credit history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit history' },
      { status: 500 }
    );
  }
}