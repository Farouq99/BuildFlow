import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPayrollEntrySchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Users, DollarSign, Calendar, Calculator } from "lucide-react";
import { format } from "date-fns";
import type { PayrollEntry } from "@shared/schema";
import { z } from "zod";

const payrollFormSchema = insertPayrollEntrySchema.extend({
  hourlyRate: z.coerce.number().positive(),
  hoursWorked: z.coerce.number().min(0),
  overtimeHours: z.coerce.number().min(0),
  overtimeRate: z.coerce.number().min(0),
  grossPay: z.coerce.number().min(0),
  taxes: z.coerce.number().min(0),
  benefits: z.coerce.number().min(0),
  deductions: z.coerce.number().min(0),
  netPay: z.coerce.number().min(0),
});

type PayrollFormData = z.infer<typeof payrollFormSchema>;

export default function PayrollPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for selection
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Fetch payroll entries for selected project
  const { data: payrollEntries = [], isLoading: payrollLoading } = useQuery({
    queryKey: ['/api/projects', selectedProjectId, 'payroll'],
    enabled: !!selectedProjectId,
  });

  // Fetch team members for the project
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['/api/projects', selectedProjectId, 'members'],
    enabled: !!selectedProjectId,
  });

  const form = useForm<PayrollFormData>({
    resolver: zodResolver(payrollFormSchema),
    defaultValues: {
      employeeName: "",
      position: "",
      hourlyRate: 0,
      hoursWorked: 0,
      overtimeHours: 0,
      overtimeRate: 0,
      grossPay: 0,
      taxes: 0,
      benefits: 0,
      deductions: 0,
      netPay: 0,
      payPeriodStart: new Date().toISOString().split('T')[0],
      payPeriodEnd: new Date().toISOString().split('T')[0],
    },
  });

  const createPayrollMutation = useMutation({
    mutationFn: async (data: PayrollFormData) => {
      return apiRequest(`/api/projects/${selectedProjectId}/payroll`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', selectedProjectId, 'payroll'] });
      toast({
        title: "Success",
        description: "Payroll entry created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create payroll entry",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PayrollFormData) => {
    createPayrollMutation.mutate(data);
  };

  // Auto-calculate gross pay, net pay when relevant fields change
  const watchHourlyRate = form.watch("hourlyRate");
  const watchHoursWorked = form.watch("hoursWorked");
  const watchOvertimeHours = form.watch("overtimeHours");
  const watchOvertimeRate = form.watch("overtimeRate");
  const watchTaxes = form.watch("taxes");
  const watchBenefits = form.watch("benefits");
  const watchDeductions = form.watch("deductions");

  useState(() => {
    const regularPay = (watchHourlyRate || 0) * (watchHoursWorked || 0);
    const overtimePay = (watchOvertimeRate || watchHourlyRate * 1.5 || 0) * (watchOvertimeHours || 0);
    const grossPay = regularPay + overtimePay;
    const netPay = grossPay - (watchTaxes || 0) - (watchBenefits || 0) - (watchDeductions || 0);

    if (grossPay !== form.getValues("grossPay")) {
      form.setValue("grossPay", grossPay);
    }
    if (netPay !== form.getValues("netPay")) {
      form.setValue("netPay", Math.max(0, netPay));
    }
    
    // Auto-set overtime rate to 1.5x regular rate if not set
    if (!form.getValues("overtimeRate") && watchHourlyRate) {
      form.setValue("overtimeRate", watchHourlyRate * 1.5);
    }
  }, [watchHourlyRate, watchHoursWorked, watchOvertimeHours, watchOvertimeRate, watchTaxes, watchBenefits, watchDeductions, form]);

  const totalGrossPay = payrollEntries.reduce((sum: number, entry: any) => {
    return sum + parseFloat(entry.grossPay || 0);
  }, 0);

  const totalNetPay = payrollEntries.reduce((sum: number, entry: any) => {
    return sum + parseFloat(entry.netPay || 0);
  }, 0);

  const totalTaxes = payrollEntries.reduce((sum: number, entry: any) => {
    return sum + parseFloat(entry.taxes || 0);
  }, 0);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-construction-gray">Payroll Management</h2>
          <p className="text-muted-foreground">
            Manage employee payroll, track hours, and calculate wages for construction projects
          </p>
        </div>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
          <CardDescription>
            Choose a project to view and manage its payroll entries
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
          {/* Payroll Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalGrossPay.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Before taxes and deductions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalNetPay.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  After taxes and deductions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Taxes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalTaxes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Tax withholdings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payroll Entries</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payrollEntries.length}</div>
                <p className="text-xs text-muted-foreground">
                  Total payroll records
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payroll Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payroll Entries</CardTitle>
                <CardDescription>
                  Employee payroll records for the selected project
                </CardDescription>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-construction-orange hover:bg-orange-600">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Payroll Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Create Payroll Entry</DialogTitle>
                    <DialogDescription>
                      Add a new payroll entry for an employee on this project
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Employee Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Employee Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Team Member (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select team member" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {teamMembers.map((member: any) => (
                                      <SelectItem key={member.userId} value={member.userId}>
                                        {member.user.firstName} {member.user.lastName} - {member.role}
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
                            name="employeeName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employee Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Full name"
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
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Position</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Job title/position"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Hours and Rate */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Hours & Rate</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="hourlyRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hourly Rate</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder="25.00"
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
                            name="hoursWorked"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Regular Hours</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.25"
                                    placeholder="40.00"
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
                            name="overtimeHours"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Overtime Hours</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.25"
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
                            name="overtimeRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Overtime Rate</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.01"
                                    placeholder="37.50"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Pay Period */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Pay Period</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="payPeriodStart"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Period Start</FormLabel>
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
                            name="payPeriodEnd"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Period End</FormLabel>
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
                            name="payDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pay Date (Optional)</FormLabel>
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
                        </div>
                      </div>

                      {/* Deductions */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Deductions & Benefits</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="taxes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Taxes</FormLabel>
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
                            name="benefits"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Benefits</FormLabel>
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
                            name="deductions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Other Deductions</FormLabel>
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
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="space-y-4 bg-muted p-4 rounded-lg">
                        <h3 className="text-lg font-semibold">Pay Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Gross Pay:</span>
                            <span className="ml-2">${form.watch("grossPay")?.toFixed(2) || "0.00"}</span>
                          </div>
                          <div>
                            <span className="font-medium">Net Pay:</span>
                            <span className="ml-2">${form.watch("netPay")?.toFixed(2) || "0.00"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createPayrollMutation.isPending}
                          className="bg-construction-orange hover:bg-orange-600"
                        >
                          {createPayrollMutation.isPending ? "Creating..." : "Create Entry"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Pay Period</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>Taxes</TableHead>
                    <TableHead>Net Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Loading payroll entries...
                      </TableCell>
                    </TableRow>
                  ) : payrollEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No payroll entries found. Click "Add Payroll Entry" to create your first entry.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrollEntries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.employeeName}</TableCell>
                        <TableCell>{entry.position || 'N/A'}</TableCell>
                        <TableCell>
                          {format(new Date(entry.payPeriodStart), 'MMM dd')} - {format(new Date(entry.payPeriodEnd), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {parseFloat(entry.hoursWorked || 0).toFixed(1)} + {parseFloat(entry.overtimeHours || 0).toFixed(1)}h OT
                        </TableCell>
                        <TableCell>${parseFloat(entry.grossPay || 0).toLocaleString()}</TableCell>
                        <TableCell>${parseFloat(entry.taxes || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">
                          ${parseFloat(entry.netPay || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
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