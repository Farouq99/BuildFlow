import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CostCalculator() {
  const [activeTab, setActiveTab] = useState("project");
  
  // Project Cost Calculator
  const [projectCosts, setProjectCosts] = useState({
    materials: "",
    labor: "",
    equipment: "",
    permits: "",
    overhead: "15", // percentage
    profit: "20" // percentage
  });

  // Labor Rate Calculator
  const [laborRates, setLaborRates] = useState({
    hourlyRate: "",
    hoursPerDay: "8",
    daysPerWeek: "5",
    weeksPerMonth: "4"
  });

  // Markup Calculator
  const [markupCalc, setMarkupCalc] = useState({
    cost: "",
    markupPercentage: "",
    targetProfit: ""
  });

  const [results, setResults] = useState<any>(null);

  const calculateProjectCost = () => {
    const materials = parseFloat(projectCosts.materials) || 0;
    const labor = parseFloat(projectCosts.labor) || 0;
    const equipment = parseFloat(projectCosts.equipment) || 0;
    const permits = parseFloat(projectCosts.permits) || 0;
    const overheadPercent = parseFloat(projectCosts.overhead) || 0;
    const profitPercent = parseFloat(projectCosts.profit) || 0;

    const subtotal = materials + labor + equipment + permits;
    const overhead = subtotal * (overheadPercent / 100);
    const costWithOverhead = subtotal + overhead;
    const profit = costWithOverhead * (profitPercent / 100);
    const totalCost = costWithOverhead + profit;

    return {
      subtotal: subtotal.toFixed(2),
      overhead: overhead.toFixed(2),
      profit: profit.toFixed(2),
      totalCost: totalCost.toFixed(2),
      breakdown: {
        materials: materials.toFixed(2),
        labor: labor.toFixed(2),
        equipment: equipment.toFixed(2),
        permits: permits.toFixed(2)
      }
    };
  };

  const calculateLaborRate = () => {
    const hourly = parseFloat(laborRates.hourlyRate) || 0;
    const hoursPerDay = parseFloat(laborRates.hoursPerDay) || 8;
    const daysPerWeek = parseFloat(laborRates.daysPerWeek) || 5;
    const weeksPerMonth = parseFloat(laborRates.weeksPerMonth) || 4;

    const daily = hourly * hoursPerDay;
    const weekly = daily * daysPerWeek;
    const monthly = weekly * weeksPerMonth;
    const yearly = monthly * 12;

    return {
      hourly: hourly.toFixed(2),
      daily: daily.toFixed(2),
      weekly: weekly.toFixed(2),
      monthly: monthly.toFixed(2),
      yearly: yearly.toFixed(2)
    };
  };

  const calculateMarkup = () => {
    const cost = parseFloat(markupCalc.cost) || 0;
    const markupPercent = parseFloat(markupCalc.markupPercentage) || 0;
    const targetProfit = parseFloat(markupCalc.targetProfit) || 0;

    const markupAmount = cost * (markupPercent / 100);
    const sellingPrice = cost + markupAmount;
    const profitMargin = (markupAmount / sellingPrice) * 100;
    
    // Calculate required markup for target profit
    const requiredMarkup = targetProfit > 0 ? (targetProfit / (100 - targetProfit)) * 100 : 0;

    return {
      cost: cost.toFixed(2),
      markupAmount: markupAmount.toFixed(2),
      sellingPrice: sellingPrice.toFixed(2),
      profitMargin: profitMargin.toFixed(2),
      requiredMarkup: requiredMarkup.toFixed(2)
    };
  };

  const handleCalculate = () => {
    let calculationResults = null;

    switch (activeTab) {
      case "project":
        calculationResults = calculateProjectCost();
        break;
      case "labor":
        calculationResults = calculateLaborRate();
        break;
      case "markup":
        calculationResults = calculateMarkup();
        break;
    }

    setResults(calculationResults);
  };

  const handleReset = () => {
    switch (activeTab) {
      case "project":
        setProjectCosts({
          materials: "",
          labor: "",
          equipment: "",
          permits: "",
          overhead: "15",
          profit: "20"
        });
        break;
      case "labor":
        setLaborRates({
          hourlyRate: "",
          hoursPerDay: "8",
          daysPerWeek: "5",
          weeksPerMonth: "4"
        });
        break;
      case "markup":
        setMarkupCalc({
          cost: "",
          markupPercentage: "",
          targetProfit: ""
        });
        break;
    }
    setResults(null);
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(parseFloat(amount));
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="project">Project Cost</TabsTrigger>
          <TabsTrigger value="labor">Labor Rates</TabsTrigger>
          <TabsTrigger value="markup">Markup</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Cost Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="materials">Materials Cost ($)</Label>
                  <Input
                    id="materials"
                    type="number"
                    placeholder="0.00"
                    value={projectCosts.materials}
                    onChange={(e) => setProjectCosts(prev => ({ ...prev, materials: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="labor">Labor Cost ($)</Label>
                  <Input
                    id="labor"
                    type="number"
                    placeholder="0.00"
                    value={projectCosts.labor}
                    onChange={(e) => setProjectCosts(prev => ({ ...prev, labor: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="equipment">Equipment Cost ($)</Label>
                  <Input
                    id="equipment"
                    type="number"
                    placeholder="0.00"
                    value={projectCosts.equipment}
                    onChange={(e) => setProjectCosts(prev => ({ ...prev, equipment: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="permits">Permits & Fees ($)</Label>
                  <Input
                    id="permits"
                    type="number"
                    placeholder="0.00"
                    value={projectCosts.permits}
                    onChange={(e) => setProjectCosts(prev => ({ ...prev, permits: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="overhead">Overhead (%)</Label>
                    <Input
                      id="overhead"
                      type="number"
                      placeholder="15"
                      value={projectCosts.overhead}
                      onChange={(e) => setProjectCosts(prev => ({ ...prev, overhead: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="profit">Profit (%)</Label>
                    <Input
                      id="profit"
                      type="number"
                      placeholder="20"
                      value={projectCosts.profit}
                      onChange={(e) => setProjectCosts(prev => ({ ...prev, profit: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleCalculate} className="flex-1 bg-construction-orange hover:bg-orange-600">
                    Calculate Total
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Project Cost Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {results && activeTab === "project" ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-construction-gray mb-2">Direct Costs</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Materials:</span>
                          <span className="font-medium">{formatCurrency(results.breakdown.materials)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Labor:</span>
                          <span className="font-medium">{formatCurrency(results.breakdown.labor)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Equipment:</span>
                          <span className="font-medium">{formatCurrency(results.breakdown.equipment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Permits:</span>
                          <span className="font-medium">{formatCurrency(results.breakdown.permits)}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-construction-gray mb-2">Additional Costs</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-medium">{formatCurrency(results.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overhead:</span>
                          <span className="font-medium">{formatCurrency(results.overhead)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profit:</span>
                          <span className="font-medium">{formatCurrency(results.profit)}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-construction-orange bg-opacity-10 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-construction-gray">Total Project Cost:</span>
                        <span className="text-xl font-bold text-construction-orange">
                          {formatCurrency(results.totalCost)}
                        </span>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      Save Calculation
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-chart-pie text-4xl mb-4 block"></i>
                    <p>Enter project costs and click Calculate to see breakdown</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="labor" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Labor Rate Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Labor Rate Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hourly-rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly-rate"
                    type="number"
                    placeholder="0.00"
                    value={laborRates.hourlyRate}
                    onChange={(e) => setLaborRates(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="hours-per-day">Hours per Day</Label>
                  <Input
                    id="hours-per-day"
                    type="number"
                    placeholder="8"
                    value={laborRates.hoursPerDay}
                    onChange={(e) => setLaborRates(prev => ({ ...prev, hoursPerDay: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="days-per-week">Days per Week</Label>
                  <Input
                    id="days-per-week"
                    type="number"
                    placeholder="5"
                    value={laborRates.daysPerWeek}
                    onChange={(e) => setLaborRates(prev => ({ ...prev, daysPerWeek: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="weeks-per-month">Weeks per Month</Label>
                  <Input
                    id="weeks-per-month"
                    type="number"
                    placeholder="4"
                    value={laborRates.weeksPerMonth}
                    onChange={(e) => setLaborRates(prev => ({ ...prev, weeksPerMonth: e.target.value }))}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleCalculate} className="flex-1 bg-construction-orange hover:bg-orange-600">
                    Calculate Rates
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Labor Rate Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Calculated Rates</CardTitle>
              </CardHeader>
              <CardContent>
                {results && activeTab === "labor" ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-construction-gray mb-2">Rate Breakdown</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Hourly Rate:</span>
                          <span className="font-medium">{formatCurrency(results.hourly)}/hr</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Rate:</span>
                          <span className="font-medium">{formatCurrency(results.daily)}/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weekly Rate:</span>
                          <span className="font-medium">{formatCurrency(results.weekly)}/week</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Rate:</span>
                          <span className="font-medium">{formatCurrency(results.monthly)}/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Yearly Rate:</span>
                          <span className="font-medium">{formatCurrency(results.yearly)}/year</span>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      Save Calculation
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-calculator text-4xl mb-4 block"></i>
                    <p>Enter hourly rate and schedule to calculate rates</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="markup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Markup Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Markup Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="0.00"
                    value={markupCalc.cost}
                    onChange={(e) => setMarkupCalc(prev => ({ ...prev, cost: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="markup-percentage">Markup Percentage (%)</Label>
                  <Input
                    id="markup-percentage"
                    type="number"
                    placeholder="0"
                    value={markupCalc.markupPercentage}
                    onChange={(e) => setMarkupCalc(prev => ({ ...prev, markupPercentage: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="target-profit">Target Profit Margin (%)</Label>
                  <Input
                    id="target-profit"
                    type="number"
                    placeholder="0"
                    value={markupCalc.targetProfit}
                    onChange={(e) => setMarkupCalc(prev => ({ ...prev, targetProfit: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter to calculate required markup</p>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleCalculate} className="flex-1 bg-construction-orange hover:bg-orange-600">
                    Calculate Markup
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Markup Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Markup Results</CardTitle>
              </CardHeader>
              <CardContent>
                {results && activeTab === "markup" ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-construction-gray mb-2">Pricing</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span className="font-medium">{formatCurrency(results.cost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Markup Amount:</span>
                          <span className="font-medium">{formatCurrency(results.markupAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Selling Price:</span>
                          <span className="font-medium">{formatCurrency(results.sellingPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profit Margin:</span>
                          <span className="font-medium">{results.profitMargin}%</span>
                        </div>
                      </div>
                    </div>

                    {parseFloat(markupCalc.targetProfit) > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-semibold text-construction-gray mb-2">Target Analysis</h4>
                          <div className="flex justify-between text-sm">
                            <span>Required Markup for {markupCalc.targetProfit}% margin:</span>
                            <span className="font-medium">{results.requiredMarkup}%</span>
                          </div>
                        </div>
                      </>
                    )}

                    <Button className="w-full" variant="outline">
                      Save Calculation
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-percentage text-4xl mb-4 block"></i>
                    <p>Enter cost and markup to calculate selling price</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
