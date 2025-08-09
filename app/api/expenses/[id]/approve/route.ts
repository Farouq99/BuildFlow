import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { expenses, projects } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export const PATCH = withAuth(async (request, user, { params }) => {
  try {
    const expenseId = params.id;

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    // Find the expense and verify user has access
    const [expense] = await db.select({
      id: expenses.id,
      projectId: expenses.projectId,
      isApproved: expenses.isApproved,
    })
    .from(expenses)
    .leftJoin(projects, eq(expenses.projectId, projects.id))
    .where(and(
      eq(expenses.id, expenseId),
      eq(projects.managerId, user.id)
    ))
    .limit(1);

    if (!expense) {
      return NextResponse.json(
        { error: 'Expense not found or access denied' },
        { status: 404 }
      );
    }

    if (expense.isApproved) {
      return NextResponse.json(
        { error: 'Expense is already approved' },
        { status: 400 }
      );
    }

    // Update the expense to approved
    const [updatedExpense] = await db.update(expenses)
      .set({
        isApproved: true,
        approvedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Error approving expense:', error);
    return NextResponse.json(
      { error: 'Failed to approve expense' },
      { status: 500 }
    );
  }
});