import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-steel-blue via-bright-blue to-construction-orange">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4 font-inter">
            ConstructPro
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Comprehensive construction management platform with seamless file sharing, 
            built-in calculators, and unified project management
          </p>
        </header>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-construction-orange rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-project-diagram text-white text-xl"></i>
              </div>
              <CardTitle>Project Management</CardTitle>
              <CardDescription className="text-blue-100">
                Streamline your construction projects with real-time tracking and collaboration
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-construction-orange rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-file-alt text-white text-xl"></i>
              </div>
              <CardTitle>File Sharing</CardTitle>
              <CardDescription className="text-blue-100">
                Universal file sharing with drag-and-drop uploads and version control
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-construction-orange rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-calculator text-white text-xl"></i>
              </div>
              <CardTitle>Built-in Calculators</CardTitle>
              <CardDescription className="text-blue-100">
                Comprehensive calculator suite for materials, concrete, and cost estimation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-construction-orange rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-users text-white text-xl"></i>
              </div>
              <CardTitle>Team Collaboration</CardTitle>
              <CardDescription className="text-blue-100">
                Role-based permissions and instant notifications for seamless teamwork
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-construction-orange rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-chart-line text-white text-xl"></i>
              </div>
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription className="text-blue-100">
                Real-time project progress with photo documentation and reporting
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <div className="w-12 h-12 bg-construction-orange rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-dollar-sign text-white text-xl"></i>
              </div>
              <CardTitle>Budget Management</CardTitle>
              <CardDescription className="text-blue-100">
                Track costs and budgets with detailed breakdowns by category
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-md mx-auto bg-white">
            <CardHeader>
              <CardTitle className="text-construction-gray">
                Ready to streamline your construction projects?
              </CardTitle>
              <CardDescription>
                Join thousands of construction professionals using ConstructPro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-construction-orange hover:bg-orange-600 text-white"
                onClick={() => window.location.href = '/api/login'}
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Get Started
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
