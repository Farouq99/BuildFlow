import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@shared/schema";

export default function BudgetOverview() {
  const [selectedPeriod, setSelectedPeriod] = useState("this-month");

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Mock budget categories - in production this would come from an API
  const budgetCategories = [
    {
      name: "Materials",
      spent: 485200,
      budget: 600000,
      color: "construction-orange"
    },
    {
      name: "Labor", 
      spent: 298500,
      budget: 400000,
      color: "blue-500"
    },
    {
      name: "Equipment",
      spent: 156800,
      budget: 200000,
      color: "green-500"
    },
    {
      name: "Permits & Fees",
      spent: 45300,
      budget: 80000,
      color: "purple-500"
    }
  ];

  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.budget, 0);
  const overallProgress = (totalSpent / totalBudget) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Budget Overview</CardTitle>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {budgetCategories.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-chart-pie text-gray-400 text-xl"></i>
            </div>
            <h4 className="font-medium text-construction-gray mb-2">No budget data</h4>
            <p className="text-sm text-gray-500">Budget information will appear here once projects are created</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetCategories.map((category, index) => {
              const percentage = (category.spent / category.budget) * 100;
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 bg-${category.color} rounded-full`}></div>
                    <span className="text-sm font-medium text-construction-gray">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-construction-gray">{formatCurrency(category.spent)}</p>
                    <p className="text-xs text-gray-500">of {formatCurrency(category.budget)}</p>
                  </div>
                </div>
              );
            })}

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-construction-gray">Total Spent</span>
                <span className="text-lg font-bold text-construction-gray">{formatCurrency(totalSpent)}</span>
              </div>
              <div className="mt-2">
                <Progress value={overallProgress} className="h-3" />
                <p className="text-xs text-gray-500 mt-1">{Math.round(overallProgress)}% of total budget</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
