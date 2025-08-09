import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { expenses, projects } from '@/lib/schema';
import { insertExpenseSchema } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// GET /api/expenses - Get expenses for a specific project
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the project
    const project = await db.select().from(projects)
      .where(and(
        eq(projects.id, projectId),
        eq(projects.managerId, user.id)
      ))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const projectExpenses = await db.select().from(expenses)
      .where(eq(expenses.projectId, projectId))
      .orderBy(expenses.createdAt);

    return NextResponse.json(projectExpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
});

// POST /api/expenses - Create a new expense
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const validatedData = insertExpenseSchema.parse(body);

    // Verify user has access to the project
    const project = await db.select().from(projects)
      .where(and(
        eq(projects.id, validatedData.projectId),
        eq(projects.managerId, user.id)
      ))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate total amount
    const amount = parseFloat(validatedData.amount.toString());
    const taxAmount = parseFloat(validatedData.taxAmount?.toString() || '0');
    const totalAmount = amount + taxAmount;

    const [expense] = await db.insert(expenses).values({
      ...validatedData,
      totalAmount: totalAmount.toString(),
      submittedBy: user.id,
      isApproved: false,
    }).returning();

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
});