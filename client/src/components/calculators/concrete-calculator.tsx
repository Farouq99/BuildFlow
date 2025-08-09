import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ConcreteCalculator() {
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "",
    depth: "",
    unit: "feet"
  });
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    const length = parseFloat(dimensions.length);
    const width = parseFloat(dimensions.width);
    const depth = parseFloat(dimensions.depth);

    if (!length || !width || !depth) {
      return;
    }

    // Convert to feet if necessary
    const lengthFt = dimensions.unit === "meters" ? length * 3.28084 : length;
    const widthFt = dimensions.unit === "meters" ? width * 3.28084 : width;
    const depthFt = dimensions.unit === "meters" ? depth * 3.28084 : depth;

    // Calculate volume in cubic feet
    const volumeCubicFeet = lengthFt * widthFt * depthFt;
    
    // Convert to cubic yards (1 cubic yard = 27 cubic feet)
    const volumeCubicYards = volumeCubicFeet / 27;

    // Calculate bags needed (assuming 80lb bags covering 0.6 cubic feet each)
    const bagsNeeded = Math.ceil(volumeCubicFeet / 0.6);

    // Estimate costs (rough estimates)
    const costPerCubicYard = 150; // $150 per cubic yard
    const costPerBag = 6; // $6 per 80lb bag
    
    const readyMixCost = volumeCubicYards * costPerCubicYard;
    const bagCost = bagsNeeded * costPerBag;

    setResults({
      volumeCubicFeet: volumeCubicFeet.toFixed(2),
      volumeCubicYards: volumeCubicYards.toFixed(2),
      bagsNeeded,
      readyMixCost: readyMixCost.toFixed(2),
      bagCost: bagCost.toFixed(2)
    });
  };

  const handleReset = () => {
    setDimensions({ length: "", width: "", depth: "", unit: "feet" });
    setResults(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="length">Length</Label>
                <Input
                  id="length"
                  type="number"
                  placeholder="0"
                  value={dimensions.length}
                  onChange={(e) => setDimensions(prev => ({ ...prev, length: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  type="number"
                  placeholder="0"
                  value={dimensions.width}
                  onChange={(e) => setDimensions(prev => ({ ...prev, width: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="depth">Depth/Thickness</Label>
              <Input
                id="depth"
                type="number"
                placeholder="0"
                value={dimensions.depth}
                onChange={(e) => setDimensions(prev => ({ ...prev, depth: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={dimensions.unit} onValueChange={(value) => setDimensions(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feet">Feet</SelectItem>
                  <SelectItem value="meters">Meters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleCalculate} className="flex-1 bg-construction-orange hover:bg-orange-600">
                Calculate
              </Button>
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calculation Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-construction-gray mb-2">Volume Required</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Cubic Feet:</span>
                      <span className="font-medium">{results.volumeCubicFeet} ft³</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cubic Yards:</span>
                      <span className="font-medium">{results.volumeCubicYards} yd³</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-construction-gray mb-2">Material Needed</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>80lb Bags:</span>
                      <span className="font-medium">{results.bagsNeeded} bags</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold text-construction-gray mb-2">Estimated Costs</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Ready Mix:</span>
                      <span className="font-medium">${results.readyMixCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bagged Mix:</span>
                      <span className="font-medium">${results.bagCost}</span>
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
                <p>Enter dimensions and click Calculate to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
