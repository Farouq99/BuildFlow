import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MaterialEstimator() {
  const [projectType, setProjectType] = useState("flooring");
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "",
    height: "",
    unit: "feet"
  });
  const [results, setResults] = useState<any>(null);

  const calculateFlooring = () => {
    const length = parseFloat(dimensions.length);
    const width = parseFloat(dimensions.width);
    
    if (!length || !width) return null;

    const area = length * width;
    const waste = area * 0.1; // 10% waste factor
    const totalArea = area + waste;

    return {
      area: area.toFixed(2),
      waste: waste.toFixed(2),
      totalArea: totalArea.toFixed(2),
      materials: {
        hardwood: Math.ceil(totalArea / 20), // 20 sq ft per box
        tile: Math.ceil(totalArea / 10), // 10 sq ft per box
        carpet: Math.ceil(totalArea / 12), // 12 sq ft per roll
        vinyl: Math.ceil(totalArea / 48) // 48 sq ft per plank box
      }
    };
  };

  const calculateFraming = () => {
    const length = parseFloat(dimensions.length);
    const width = parseFloat(dimensions.width);
    const height = parseFloat(dimensions.height);
    
    if (!length || !width || !height) return null;

    const perimeterLinearFeet = (length + width) * 2;
    const studSpacing = 16; // 16" on center
    const studCount = Math.ceil((perimeterLinearFeet * 12) / studSpacing) + 4; // +4 for corners
    
    // Calculate lumber needed
    const plateLength = perimeterLinearFeet * 2; // top and bottom plates
    const studLength = studCount * height;
    
    return {
      perimeterFeet: perimeterLinearFeet.toFixed(2),
      studCount,
      lumber: {
        plates: Math.ceil(plateLength / 8), // 8ft boards
        studs: Math.ceil(studLength / 8), // 8ft studs
        headers: Math.ceil(length / 8) + Math.ceil(width / 8)
      }
    };
  };

  const calculateRoofing = () => {
    const length = parseFloat(dimensions.length);
    const width = parseFloat(dimensions.width);
    
    if (!length || !width) return null;

    const roofArea = length * width;
    const waste = roofArea * 0.15; // 15% waste for roofing
    const totalArea = roofArea + waste;
    
    // Convert to squares (100 sq ft = 1 square)
    const squares = totalArea / 100;

    return {
      roofArea: roofArea.toFixed(2),
      totalArea: totalArea.toFixed(2),
      squares: squares.toFixed(2),
      materials: {
        shingles: Math.ceil(squares), // bundles per square
        underlayment: Math.ceil(totalArea / 400), // 400 sq ft per roll
        nails: Math.ceil(squares * 2), // 2 lbs per square
        ridgeCap: Math.ceil(length / 3) // 3ft per piece
      }
    };
  };

  const handleCalculate = () => {
    let calculationResults = null;

    switch (projectType) {
      case "flooring":
        calculationResults = calculateFlooring();
        break;
      case "framing":
        calculationResults = calculateFraming();
        break;
      case "roofing":
        calculationResults = calculateRoofing();
        break;
    }

    setResults(calculationResults);
  };

  const handleReset = () => {
    setDimensions({ length: "", width: "", height: "", unit: "feet" });
    setResults(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-type">Project Type</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flooring">Flooring</SelectItem>
                  <SelectItem value="framing">Framing</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
            
            {projectType === "framing" && (
              <div>
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="0"
                  value={dimensions.height}
                  onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
                />
              </div>
            )}

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
                Calculate Materials
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
            <CardTitle className="text-lg">Material Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-4">
                {projectType === "flooring" && (
                  <>
                    <div>
                      <h4 className="font-semibold text-construction-gray mb-2">Area Calculations</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Area:</span>
                          <span className="font-medium">{results.area} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Waste (10%):</span>
                          <span className="font-medium">{results.waste} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Area:</span>
                          <span className="font-medium">{results.totalArea} sq ft</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-construction-gray mb-2">Material Boxes/Rolls</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Hardwood Boxes:</span>
                          <span className="font-medium">{results.materials.hardwood}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tile Boxes:</span>
                          <span className="font-medium">{results.materials.tile}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carpet Rolls:</span>
                          <span className="font-medium">{results.materials.carpet}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vinyl Boxes:</span>
                          <span className="font-medium">{results.materials.vinyl}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {projectType === "framing" && (
                  <>
                    <div>
                      <h4 className="font-semibold text-construction-gray mb-2">Frame Specifications</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Perimeter:</span>
                          <span className="font-medium">{results.perimeterFeet} ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Studs Needed:</span>
                          <span className="font-medium">{results.studCount}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-construction-gray mb-2">Lumber (8ft pieces)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Plates (2x4):</span>
                          <span className="font-medium">{results.lumber.plates}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Studs (2x4):</span>
                          <span className="font-medium">{results.lumber.studs}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Headers (2x8):</span>
                          <span className="font-medium">{results.lumber.headers}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {projectType === "roofing" && (
                  <>
                    <div>
                      <h4 className="font-semibold text-construction-gray mb-2">Roof Area</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Area:</span>
                          <span className="font-medium">{results.roofArea} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total with Waste:</span>
                          <span className="font-medium">{results.totalArea} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Squares:</span>
                          <span className="font-medium">{results.squares}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-construction-gray mb-2">Materials Needed</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Shingle Bundles:</span>
                          <span className="font-medium">{results.materials.shingles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Underlayment Rolls:</span>
                          <span className="font-medium">{results.materials.underlayment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Roofing Nails (lbs):</span>
                          <span className="font-medium">{results.materials.nails}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ridge Cap Pieces:</span>
                          <span className="font-medium">{results.materials.ridgeCap}</span>
                        </div>
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
                <i className="fas fa-ruler-combined text-4xl mb-4 block"></i>
                <p>Enter project details and click Calculate to see material requirements</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
