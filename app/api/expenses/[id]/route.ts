import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { expenses, projects } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateExpenseSchema = z.object({
  category: z.string().optional(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  amount: z.string().optional(),
  taxAmount: z.string().optional(),
  dateIncurred: z.string().optional(),
});

export const PATCH = withAuth(async (request, user, { params }) => {
  try {
    const expenseId = params.id;

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateExpenseSchema.parse(body);

    // Find the expense and verify user has access
    const [expense] = await db.select({
      id: expenses.id,
      projectId: expenses.projectId,
      amount: expenses.amount,
      taxAmount: expenses.taxAmount,
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

    // Calculate new total if amount or tax changed
    let totalAmount = undefined;
    if (validatedData.amount || validatedData.taxAmount) {
      const newAmount = parseFloat(validatedData.amount || expense.amount);
      const newTaxAmount = parseFloat(validatedData.taxAmount || expense.taxAmount);
      totalAmount = (newAmount + newTaxAmount).toString();
    }

    // Update the expense
    const [updatedExpense] = await db.update(expenses)
      .set({
        ...validatedData,
        ...(totalAmount && { totalAmount }),
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
});