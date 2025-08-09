import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Available expense categories from the schema
export const EXPENSE_CATEGORIES = [
  'materials',
  'labor', 
  'equipment',
  'transportation',
  'permits',
  'utilities',
  'subcontractor',
  'overhead',
  'other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface ExpenseCategorySuggestion {
  category: ExpenseCategory;
  confidence: number;
  reasoning: string;
}

export async function categorizeExpense(
  description: string,
  vendor?: string,
  amount?: number
): Promise<ExpenseCategorySuggestion> {
  try {
    const prompt = `You are an AI assistant helping categorize construction project expenses.

Available categories:
- materials: Construction materials, supplies, hardware, lumber, concrete, etc.
- labor: Direct labor costs, wages, contractor fees for human work
- equipment: Tools, machinery, equipment rental or purchase
- transportation: Vehicle costs, fuel, delivery, shipping
- permits: Government permits, licenses, inspections
- utilities: Electricity, water, gas, internet, phone services
- subcontractor: Third-party contractor services (electrical, plumbing, etc.)
- overhead: Office supplies, insurance, general business expenses
- other: Items that don't fit other categories

Analyze this expense and suggest the most appropriate category:
Description: "${description}"
${vendor ? `Vendor: "${vendor}"` : ''}
${amount ? `Amount: $${amount}` : ''}

Respond in JSON format with:
{
  "category": "most_appropriate_category",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category fits best"
}

Consider context clues like vendor names, expense descriptions, and typical construction workflows.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent categorization
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate the response and ensure it's a valid category
    const category = result.category as ExpenseCategory;
    if (!EXPENSE_CATEGORIES.includes(category)) {
      throw new Error(`Invalid category returned: ${category}`);
    }

    return {
      category,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      reasoning: result.reasoning || 'AI categorization based on description analysis'
    };

  } catch (error) {
    console.error('Error categorizing expense:', error);
    
    // Fallback to simple rule-based categorization
    const lowerDescription = description.toLowerCase();
    
    if (lowerDescription.includes('lumber') || lowerDescription.includes('concrete') || 
        lowerDescription.includes('material') || lowerDescription.includes('supply')) {
      return {
        category: 'materials',
        confidence: 0.6,
        reasoning: 'Fallback categorization based on keyword matching'
      };
    }
    
    if (lowerDescription.includes('labor') || lowerDescription.includes('worker') || 
        lowerDescription.includes('wage')) {
      return {
        category: 'labor',
        confidence: 0.6,
        reasoning: 'Fallback categorization based on keyword matching'
      };
    }
    
    if (lowerDescription.includes('tool') || lowerDescription.includes('equipment') || 
        lowerDescription.includes('machinery')) {
      return {
        category: 'equipment',
        confidence: 0.6,
        reasoning: 'Fallback categorization based on keyword matching'
      };
    }

    // Default fallback
    return {
      category: 'other',
      confidence: 0.3,
      reasoning: 'Unable to categorize automatically - defaulted to other'
    };
  }
}

export async function batchCategorizeExpenses(
  expenses: Array<{
    id: string;
    description: string;
    vendor?: string;
    amount?: number;
  }>
): Promise<Array<{ id: string; suggestion: ExpenseCategorySuggestion }>> {
  const results = await Promise.allSettled(
    expenses.map(async (expense) => ({
      id: expense.id,
      suggestion: await categorizeExpense(expense.description, expense.vendor, expense.amount)
    }))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<{ id: string; suggestion: ExpenseCategorySuggestion }> => 
      result.status === 'fulfilled')
    .map(result => result.value);
}