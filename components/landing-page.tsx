'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  FileText, 
  Calculator, 
  Users, 
  Shield, 
  Zap,
  HardHat,
  Wrench,
  Upload,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-construction-orange" />
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ConstructPro
            </span>
            <Badge variant="secondary" className="ml-2">
              Enterprise
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button className="construction-gradient text-white" asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-construction-orange/10 px-4 py-2 rounded-full mb-8">
            <Shield className="h-4 w-4 text-construction-orange" />
            <span className="text-sm font-medium text-construction-orange">
              Enterprise-Grade Security & CAD Integration
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            The Ultimate
            <span className="block text-construction-orange">
              Construction Platform
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Comprehensive project management with seamless AutoCAD/Revit integration, 
            enterprise file handling, real-time collaboration, and production-ready features 
            for construction teams of all sizes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
            <Button size="lg" className="construction-gradient text-white px-8" asChild>
              <Link href="/auth/register">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-construction-orange mb-2">500+</div>
              <div className="text-slate-600 dark:text-slate-300">Projects Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-construction-orange mb-2">100MB</div>
              <div className="text-slate-600 dark:text-slate-300">Max File Size</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-construction-orange mb-2">99.9%</div>
              <div className="text-slate-600 dark:text-slate-300">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Enterprise Construction Management
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Everything your construction team needs, from project kickoff to final punch list
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* CAD Integration */}
            <Card className="border-2 hover:border-construction-orange/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-construction-orange/10 rounded-lg flex items-center justify-center mb-4">
                  <Wrench className="h-6 w-6 text-construction-orange" />
                </div>
                <CardTitle>AutoCAD & Revit Integration</CardTitle>
                <CardDescription>
                  Native support for .dwg, .dxf, .rvt, .rfa, IFC, STEP, and other CAD formats with preview generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Autodesk Forge API integration</li>
                  <li>• Real-time CAD previews</li>
                  <li>• Version control for drawings</li>
                  <li>• Chunked uploads for large files</li>
                </ul>
              </CardContent>
            </Card>

            {/* File Management */}
            <Card className="border-2 hover:border-construction-orange/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-construction-orange/10 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-construction-orange" />
                </div>
                <CardTitle>Enterprise File Handling</CardTitle>
                <CardDescription>
                  Secure S3 storage with antivirus scanning, chunked uploads, and comprehensive audit logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• 100MB file size limit</li>
                  <li>• Real-time virus scanning</li>
                  <li>• Encrypted cloud storage</li>
                  <li>• Advanced access controls</li>
                </ul>
              </CardContent>
            </Card>

            {/* Project Management */}
            <Card className="border-2 hover:border-construction-orange/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-construction-orange/10 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-construction-orange" />
                </div>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  Complete project lifecycle management with real-time tracking and collaboration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Timeline and milestone tracking</li>
                  <li>• Budget management</li>
                  <li>• Resource allocation</li>
                  <li>• Real-time notifications</li>
                </ul>
              </CardContent>
            </Card>

            {/* Calculators */}
            <Card className="border-2 hover:border-construction-orange/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-construction-orange/10 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-construction-orange" />
                </div>
                <CardTitle>Built-in Calculators</CardTitle>
                <CardDescription>
                  Professional construction calculators for materials, costs, and concrete estimation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Concrete volume calculator</li>
                  <li>• Material estimator</li>
                  <li>• Cost calculator with margins</li>
                  <li>• Save results to projects</li>
                </ul>
              </CardContent>
            </Card>

            {/* Team Collaboration */}
            <Card className="border-2 hover:border-construction-orange/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-construction-orange/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-construction-orange" />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Role-based access control with comprehensive user management and audit trails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Role-based permissions</li>
                  <li>• Real-time activity feeds</li>
                  <li>• Team member management</li>
                  <li>• Communication tools</li>
                </ul>
              </CardContent>
            </Card>

            {/* Enterprise Features */}
            <Card className="border-2 hover:border-construction-orange/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 bg-construction-orange/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-construction-orange" />
                </div>
                <CardTitle>Enterprise Ready</CardTitle>
                <CardDescription>
                  Production-grade features including PWA support, offline capabilities, and comprehensive monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• PWA offline support</li>
                  <li>• Background job processing</li>
                  <li>• Sentry error monitoring</li>
                  <li>• Automated testing suite</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 construction-gradient">
        <div className="container mx-auto text-center">
          <HardHat className="h-16 w-16 text-white mx-auto mb-8" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Construction Workflow?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of construction teams using ConstructPro to streamline 
            their projects, manage CAD files, and collaborate more effectively.
          </p>
          <Button size="lg" variant="secondary" className="px-8" asChild>
            <Link href="/auth/register">Start Your Free Trial</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-construction-orange" />
              <span className="text-xl font-bold">ConstructPro</span>
            </div>
            <div className="text-slate-400">
              © 2024 ConstructPro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}