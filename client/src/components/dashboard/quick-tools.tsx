import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import ConcreteCalculator from "@/components/calculators/concrete-calculator";
import MaterialEstimator from "@/components/calculators/material-estimator";
import CostCalculator from "@/components/calculators/cost-calculator";
import FileDropzone from "@/components/file-upload/file-dropzone";
import HealthWidget from "./health-widget";

export default function QuickTools() {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const quickTools = [
    {
      id: "concrete",
      name: "Concrete Calculator",
      icon: "fas fa-cube",
      color: "construction-orange",
      component: ConcreteCalculator
    },
    {
      id: "materials",
      name: "Material Estimator",
      icon: "fas fa-ruler-combined",
      color: "blue-500",
      component: MaterialEstimator
    },
    {
      id: "costs",
      name: "Cost Calculator",
      icon: "fas fa-chart-pie",
      color: "green-500",
      component: CostCalculator
    }
  ];

  const handleToolClick = (toolId: string) => {
    setOpenDialog(toolId);
  };

  const currentTool = quickTools.find(tool => tool.id === openDialog);

  return (
    <>
    <div className="lg:col-span-1 space-y-4">
      {/* Health Widget */}
      <HealthWidget />
      
      {/* Quick Tools Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-construction-gray">Quick Tools</h3>
        </div>
        
        <div className="p-6 space-y-4">
          {quickTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-construction-orange hover:bg-orange-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-${tool.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                  <i className={`${tool.icon} text-${tool.color}`}></i>
                </div>
                <span className="font-medium text-construction-gray">{tool.name}</span>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </button>
          ))}

          <div className="border-t border-gray-200 pt-4 mt-4">
            <Button 
              onClick={() => setOpenDialog("upload")}
              className="w-full bg-construction-orange text-white hover:bg-orange-600"
            >
              <i className="fas fa-upload mr-2"></i>Upload Documents
            </Button>
          </div>

          <Link href="/calculators">
            <Button variant="outline" className="w-full border-construction-orange text-construction-orange hover:bg-orange-50">
              View All Calculators
            </Button>
          </Link>
        </div>
      </div>
    </div>

      {/* Tool Dialogs */}
      {currentTool && (
        <Dialog open={!!openDialog} onOpenChange={() => setOpenDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <i className={`${currentTool.icon} text-${currentTool.color}`}></i>
                <span>{currentTool.name}</span>
              </DialogTitle>
            </DialogHeader>
            <currentTool.component />
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Dialog */}
      <Dialog open={openDialog === "upload"} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          <FileDropzone />
        </DialogContent>
      </Dialog>
    </>
  );
}
