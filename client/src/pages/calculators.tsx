import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConcreteCalculator from "@/components/calculators/concrete-calculator";
import MaterialEstimator from "@/components/calculators/material-estimator";
import CostCalculator from "@/components/calculators/cost-calculator";

export default function Calculators() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-construction-gray mb-2">Construction Calculators</h2>
          <p className="text-gray-600">Professional tools for accurate construction estimates and planning</p>
        </div>

        <Tabs defaultValue="concrete" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="concrete" className="flex items-center space-x-2">
              <i className="fas fa-cube"></i>
              <span>Concrete</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center space-x-2">
              <i className="fas fa-ruler-combined"></i>
              <span>Materials</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center space-x-2">
              <i className="fas fa-chart-pie"></i>
              <span>Costs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="concrete">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-cube text-construction-orange"></i>
                  <span>Concrete Calculator</span>
                </CardTitle>
                <CardDescription>
                  Calculate concrete volume, bags needed, and material costs for your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConcreteCalculator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-ruler-combined text-blue-500"></i>
                  <span>Material Estimator</span>
                </CardTitle>
                <CardDescription>
                  Estimate materials needed for various construction tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialEstimator />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-chart-pie text-green-500"></i>
                  <span>Cost Calculator</span>
                </CardTitle>
                <CardDescription>
                  Calculate project costs, labor rates, and profit margins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CostCalculator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
