import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, DollarSign, Calendar, User, Receipt, Wand2, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import type { Expense, BudgetCategory } from "@shared/schema";
import { z } from "zod";

const expenseFormSchema = insertExpenseSchema.extend({
  amount: z.coerce.number().positive(),
  taxAmount: z.coerce.number().min(0),
  totalAmount: z.coerce.number().positive(),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

const EXPENSE_CATEGORIES = [
  { value: 'materials', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'permits', label: 'Permits' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'other', label: 'Other' },
];

interface AISuggestion {
  category: string;
  confidence: number;
  reasoning: string;
}

export default function ExpensesPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isGettingAISuggestion, setIsGettingAISuggestion] = useState(false);
  const [isBatchCategorizing, setIsBatchCategorizing] = useState(false);
  const [batchSuggestions, setBatchSuggestions] = useState<{[key: string]: AISuggestion}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Fetch expenses for selected project
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['/api/expenses', { projectId: selectedProjectId }],
    queryFn: () => apiRequest(`/api/expenses?projectId=${selectedProjectId}`),
    enabled: !!selectedProjectId,
  });

  // Fetch budget categories for the project
  const { data: budgetCategories = [] } = useQuery({
    queryKey: ['/api/projects', selectedProjectId, 'budget-categories'],
    enabled: !!selectedProjectId,
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: "",
      category: "other",
      amount: 0,
      taxAmount: 0,
      totalAmount: 0,
      vendor: "",
      notes: "",
      dateIncurred: new Date().toISOString().split('T')[0],
    },
  });

  // AI categorization function
  const getAISuggestion = async () => {
    const description = form.getValues('description');
    const vendor = form.getValues('vendor');
    const amount = form.getValues('amount');

    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please add a description first to get AI categorization suggestions",
        variant: "destructive",
      });
      return;
    }

    setIsGettingAISuggestion(true);
    setAiSuggestion(null);

    try {
      const response = await apiRequest('/api/expenses/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          vendor: vendor || undefined,
          amount: amount || undefined,
        }),
      });

      const { suggestion } = response;
      setAiSuggestion(suggestion);

      // Auto-apply if confidence is high
      if (suggestion.confidence > 0.8) {
        form.setValue('category', suggestion.category);
        toast({
          title: "AI Suggestion Applied",
          description: `Automatically set category to "${suggestion.category}" (${Math.round(suggestion.confidence * 100)}% confidence)`,
        });
      }
    } catch (error) {
      console.error('AI categorization error:', error);
      toast({
        title: "AI Suggestion Failed",
        description: "Unable to get AI category suggestion. Please select category manually.",
        variant: "destructive",
      });
    } finally {
      setIsGettingAISuggestion(false);
    }
  };

  // Apply AI suggestion manually
  const applyAISuggestion = () => {
    if (aiSuggestion) {
      form.setValue('category', aiSuggestion.category);
      toast({
        title: "Suggestion Applied",
        description: `Category set to "${aiSuggestion.category}"`,
      });
    }
  };

  // Batch categorize existing expenses
  const categorizeBatchExpenses = async () => {
    if (expenses.length === 0) return;

    setIsBatchCategorizing(true);
    setBatchSuggestions({});

    try {
      const expensesToCategorize = expenses
        .filter((expense: any) => expense.category === 'other' || !expense.category)
        .map((expense: any) => ({
          id: expense.id,
          description: expense.description,
          vendor: expense.vendor,
          amount: parseFloat(expense.amount),
        }));

      if (expensesToCategorize.length === 0) {
        toast({
          title: "No Expenses to Categorize",
          description: "All expenses already have specific categories assigned.",
        });
        return;
      }

      const response = await apiRequest('/api/expenses/categorize?batch=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenses: expensesToCategorize
        }),
      });

      const { suggestions } = response;
      const suggestionMap: {[key: string]: AISuggestion} = {};
      
      suggestions.forEach((item: any) => {
        suggestionMap[item.id] = item.suggestion;
      });

      setBatchSuggestions(suggestionMap);
      
      toast({
        title: "Batch Categorization Complete",
        description: `Got AI suggestions for ${suggestions.length} expenses. Review and apply as needed.`,
      });

    } catch (error) {
      console.error('Batch categorization error:', error);
      toast({
        title: "Batch Categorization Failed",
        description: "Unable to get AI suggestions for expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBatchCategorizing(false);
    }
  };

  // Apply batch suggestion for individual expense
  const applyBatchSuggestion = async (expenseId: string, suggestion: AISuggestion) => {
    try {
      await apiRequest(`/api/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: suggestion.category
        }),
      });

      // Remove from batch suggestions
      setBatchSuggestions(prev => {
        const newSuggestions = { ...prev };
        delete newSuggestions[expenseId];
        return newSuggestions;
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });

      toast({
        title: "Category Updated",
        description: `Expense categorized as "${suggestion.category}"`,
      });

    } catch (error) {
      toast({
        title: "Update Failed", 
        description: "Could not update expense category",
        variant: "destructive",
      });
    }
  };

  const createExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      return apiRequest('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          projectId: selectedProjectId,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Success",
        description: "Expense created successfully",
      });
      setIsCreateDialogOpen(false);
      setAiSuggestion(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create expense",
        variant: "destructive",
      });
    },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      return apiRequest(`/api/expenses/${expenseId}/approve`, {
        method: 'PATCH',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Success",
        description: "Expense approved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve expense",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  // Calculate total amounts when amount or tax changes
  const watchAmount = form.watch("amount");
  const watchTaxAmount = form.watch("taxAmount");

  useEffect(() => {
    const totalAmount = (watchAmount || 0) + (watchTaxAmount || 0);
    if (totalAmount !== form.getValues("totalAmount")) {
      form.setValue("totalAmount", totalAmount);
    }
  }, [watchAmount, watchTaxAmount, form]);

  // Status badge handled directly in component using isApproved boolean

  const totalExpenses = expenses.reduce((sum: number, expense: any) => {
    return sum + parseFloat(expense.totalAmount || 0);
  }, 0);

  const pendingExpenses = expenses.filter((expense: any) => !expense.isApproved).length;
  const approvedExpenses = expenses.filter((expense: any) => expense.isApproved).length;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-construction-gray">Expense Management</h2>
          <p className="text-muted-foreground">
            Track project expenses, manage approvals, and monitor spending across all projects
          </p>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>
            Choose a project to view and manage its expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project: any) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <>
          {/* Expense Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all expense categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingExpenses}</div>
                <p className="text-xs text-muted-foreground">
                  Expenses awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Expenses</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedExpenses}</div>
                <p className="text-xs text-muted-foreground">
                  Ready for payment
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Expenses Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Expenses</CardTitle>
                <CardDescription>
                  All expenses for the selected project
                </CardDescription>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={categorizeBatchExpenses}
                  disabled={isBatchCategorizing || expenses.length === 0}
                  variant="outline"
                  className="border-construction-orange text-construction-orange hover:bg-construction-orange hover:text-white"
                >
                  {isBatchCategorizing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI Categorizing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      AI Categorize All
                    </>
                  )}
                </Button>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-construction-orange hover:bg-orange-600">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Expense</DialogTitle>
                    <DialogDescription>
                      Add a new expense to track project costs and manage approvals
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the expense..."
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-between">
                                Category
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={getAISuggestion}
                                  disabled={isGettingAISuggestion}
                                  className="h-auto p-1 text-construction-orange hover:text-orange-600"
                                >
                                  {isGettingAISuggestion ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-4 w-4" />
                                  )}
                                  <span className="ml-1 text-xs">AI Suggest</span>
                                </Button>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {EXPENSE_CATEGORIES.map((category) => (
                                    <SelectItem key={category.value} value={category.value}>
                                      {category.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                              
                              {/* AI Suggestion Display */}
                              {aiSuggestion && (
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <Wand2 className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">
                                          AI Suggests: {EXPENSE_CATEGORIES.find(cat => cat.value === aiSuggestion.category)?.label}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                          {Math.round(aiSuggestion.confidence * 100)}% confident
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-blue-700 mt-1">
                                        {aiSuggestion.reasoning}
                                      </p>
                                    </div>
                                    {field.value !== aiSuggestion.category && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={applyAISuggestion}
                                        className="ml-2 h-8 text-xs"
                                      >
                                        Apply
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vendor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendor</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Vendor name"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="taxAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tax Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dateIncurred"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expense Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="budgetCategoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget Category (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select budget category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {budgetCategories.map((category: BudgetCategory) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Additional notes..."
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createExpenseMutation.isPending}
                          className="bg-construction-orange hover:bg-orange-600"
                        >
                          {createExpenseMutation.isPending ? "Creating..." : "Create Expense"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Loading expenses...
                      </TableCell>
                    </TableRow>
                  ) : expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No expenses found. Click "Add Expense" to create your first expense.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((expense: any) => {
                      const hasBatchSuggestion = batchSuggestions[expense.id];
                      
                      return (
                        <React.Fragment key={expense.id}>
                          <TableRow className={hasBatchSuggestion ? 'border-l-4 border-l-blue-400' : ''}>
                            <TableCell>
                              {format(new Date(expense.dateIncurred), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell className="capitalize">
                              {expense.category.replace('_', ' ')}
                              {hasBatchSuggestion && (
                                <Badge variant="outline" className="ml-2 text-xs border-blue-400 text-blue-700">
                                  AI Suggestion Available
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{expense.vendor || 'N/A'}</TableCell>
                            <TableCell>${parseFloat(expense.totalAmount || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={expense.isApproved ? 'default' : 'secondary'}>
                                {expense.isApproved ? 'Approved' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {!expense.isApproved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => approveExpenseMutation.mutate(expense.id)}
                                    disabled={approveExpenseMutation.isPending}
                                  >
                                    Approve
                                  </Button>
                                )}
                                {hasBatchSuggestion && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => applyBatchSuggestion(expense.id, hasBatchSuggestion)}
                                    className="text-blue-600 hover:bg-blue-50"
                                  >
                                    Apply AI
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* AI Suggestion Row */}
                          {hasBatchSuggestion && (
                            <TableRow className="bg-blue-50/50 border-l-4 border-l-blue-400">
                              <TableCell colSpan={7}>
                                <div className="flex items-center justify-between py-2">
                                  <div className="flex items-start gap-2">
                                    <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-blue-900">
                                          AI Suggests: {EXPENSE_CATEGORIES.find(cat => cat.value === hasBatchSuggestion.category)?.label}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                          {Math.round(hasBatchSuggestion.confidence * 100)}% confident
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-blue-700 mt-1">
                                        {hasBatchSuggestion.reasoning}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => applyBatchSuggestion(expense.id, hasBatchSuggestion)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                      Apply
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setBatchSuggestions(prev => {
                                        const newSuggestions = { ...prev };
                                        delete newSuggestions[expense.id];
                                        return newSuggestions;
                                      })}
                                      className="text-gray-600"
                                    >
                                      Dismiss
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}