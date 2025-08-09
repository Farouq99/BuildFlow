import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface ExpenseData {
  category: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  change?: number;
}

interface ExpenseOverviewProps {
  expenses?: ExpenseData[];
}

export function ExpenseOverview({ expenses = [] }: ExpenseOverviewProps) {
  // Mock data for demo
  const mockExpenses: ExpenseData[] = [
    { category: 'Materials', amount: 15420, status: 'approved', change: 8.2 },
    { category: 'Labor', amount: 28500, status: 'paid', change: -2.1 },
    { category: 'Equipment', amount: 5200, status: 'pending', change: 15.3 },
    { category: 'Permits', amount: 1800, status: 'approved', change: 0 },
  ];

  const displayExpenses = expenses.length > 0 ? expenses : mockExpenses;
  const totalAmount = displayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'approved': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Total Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-construction-orange" />
          <span className="font-medium">Total This Month</span>
        </div>
        <span className="text-lg font-bold">
          ${totalAmount.toLocaleString()}
        </span>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        {displayExpenses.map((expense, index) => (
          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{expense.category}</span>
                  <Badge variant={getStatusColor(expense.status)} className="text-xs">
                    {expense.status}
                  </Badge>
                </div>
                {expense.change !== undefined && expense.change !== 0 && (
                  <div className="flex items-center space-x-1 text-xs">
                    {expense.change > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-red-500" />
                        <span className="text-red-500">+{expense.change}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">{expense.change}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                ${expense.amount.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}