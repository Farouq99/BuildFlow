import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, DollarSign } from 'lucide-react';

interface PayrollEntry {
  id: string;
  employeeName: string;
  position: string;
  hoursWorked: number;
  grossPay: number;
  netPay: number;
}

interface PayrollSummaryProps {
  entries?: PayrollEntry[];
}

export function PayrollSummary({ entries = [] }: PayrollSummaryProps) {
  // Mock data for demo
  const mockEntries: PayrollEntry[] = [
    {
      id: '1',
      employeeName: 'John Smith',
      position: 'Site Manager',
      hoursWorked: 40,
      grossPay: 3200,
      netPay: 2560,
    },
    {
      id: '2',
      employeeName: 'Sarah Wilson',
      position: 'Electrician',
      hoursWorked: 38,
      grossPay: 2280,
      netPay: 1824,
    },
    {
      id: '3',
      employeeName: 'Mike Johnson',
      position: 'Carpenter',
      hoursWorked: 42,
      grossPay: 2520,
      netPay: 2016,
    },
  ];

  const displayEntries = entries.length > 0 ? entries : mockEntries;
  const totalHours = displayEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const totalGrossPay = displayEntries.reduce((sum, entry) => sum + entry.grossPay, 0);
  const totalNetPay = displayEntries.reduce((sum, entry) => sum + entry.netPay, 0);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <div className="text-lg font-bold">{displayEntries.length}</div>
          <div className="text-xs text-muted-foreground">Employees</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <div className="text-lg font-bold">{totalHours}</div>
          <div className="text-xs text-muted-foreground">Total Hours</div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <div className="text-lg font-bold">${totalNetPay.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Net Pay</div>
        </div>
      </div>

      {/* Employee List */}
      <div className="space-y-2">
        {displayEntries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1">
              <div className="font-medium">{entry.employeeName}</div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {entry.position}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {entry.hoursWorked}h
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                ${entry.netPay.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                (${entry.grossPay.toLocaleString()} gross)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}