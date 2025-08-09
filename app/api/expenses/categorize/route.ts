import { NextRequest, NextResponse } from 'next/server';
import { categorizeExpense, batchCategorizeExpenses } from '@/lib/ai-expense-categorizer';
import { withAuth } from '@/lib/auth';
import { z } from 'zod';

const categorizeRequestSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  vendor: z.string().optional(),
  amount: z.number().optional(),
});

const batchCategorizeRequestSchema = z.object({
  expenses: z.array(z.object({
    id: z.string(),
    description: z.string(),
    vendor: z.string().optional(),
    amount: z.number().optional(),
  }))
});

// Single expense categorization
async function handleSingleCategorization(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, vendor, amount } = categorizeRequestSchema.parse(body);
    
    const suggestion = await categorizeExpense(description, vendor, amount);
    
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error in expense categorization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to categorize expense' },
      { status: 500 }
    );
  }
}

// Batch expense categorization
async function handleBatchCategorization(request: NextRequest) {
  try {
    const body = await request.json();
    const { expenses } = batchCategorizeRequestSchema.parse(body);
    
    if (expenses.length > 50) {
      return NextResponse.json(
        { error: 'Too many expenses to categorize at once. Maximum 50 allowed.' },
        { status: 400 }
      );
    }
    
    const suggestions = await batchCategorizeExpenses(expenses);
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error in batch expense categorization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to categorize expenses' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(async (request, user) => {
  const url = new URL(request.url);
  const batch = url.searchParams.get('batch') === 'true';
  
  if (batch) {
    return handleBatchCategorization(request);
  } else {
    return handleSingleCategorization(request);
  }
});