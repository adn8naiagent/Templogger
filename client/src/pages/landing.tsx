import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Thermometer, 
  Shield, 
  Users, 
  BarChart3, 
  Download,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              FridgeSafe
            </h1>
          </div>
          <div className="flex gap-2">
            <Link to="/auth/login">
              <Button variant="outline" data-testid="button-login">
                Sign In
              </Button>
            </Link>
            <Link to="/auth/signup">
              <Button data-testid="button-signup">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Professional Temperature Monitoring for
            <span className="text-blue-600"> Pharmacies & Healthcare</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Ensure medication safety with real-time temperature logging, automated alerts, 
            and comprehensive reporting for regulatory compliance.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth/signup">
              <Button size="lg" data-testid="button-get-started">
                Get Started Free
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need for Temperature Compliance
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Built specifically for healthcare professionals who need reliable monitoring
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Thermometer className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Smart Temperature Logging</CardTitle>
              <CardDescription>
                Log temperatures with automatic timestamp and person tracking. 
                Set custom ranges for each fridge.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Real-time Alerts</CardTitle>
              <CardDescription>
                Instant notifications when temperatures go outside safe ranges. 
                Never miss a critical temperature event.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Export & Reporting</CardTitle>
              <CardDescription>
                Generate CSV reports for audits and compliance. 
                Full data export with timestamps and alert status.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Track who logged each temperature. Role-based access control 
                for staff and administrators.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                View temperature trends, compliance rates, and identify 
                patterns across all your fridges.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Secure & Compliant</CardTitle>
              <CardDescription>
                HIPAA-ready security with encrypted data storage. 
                Meets regulatory requirements for healthcare facilities.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Start free, upgrade as you grow
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Tier */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-center">Free</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <CardDescription className="text-center">
                Perfect for small clinics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Up to 2 fridges</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Basic temperature logging</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Simple CSV export</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">30-day data retention</span>
              </div>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="relative border-blue-600 border-2">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-center">Pro</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <CardDescription className="text-center">
                For growing pharmacies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Up to 10 fridges</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Real-time alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Advanced reporting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">1-year data retention</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Priority support</span>
              </div>
            </CardContent>
          </Card>

          {/* Enterprise Tier */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-center">Enterprise</CardTitle>
              <div className="text-center">
                <span className="text-3xl font-bold">$99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <CardDescription className="text-center">
                For large healthcare facilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Unlimited fridges</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Custom integrations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Advanced analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Unlimited data retention</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">24/7 dedicated support</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Ensure Medication Safety?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of healthcare professionals who trust FridgeSafe 
            for their temperature monitoring needs.
          </p>
          <Link to="/auth/signup">
            <Button size="lg" data-testid="button-start-monitoring">
              Start Monitoring Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Thermometer className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-semibold">FridgeSafe</span>
          </div>
          <p className="text-gray-400">
            Professional temperature monitoring for healthcare facilities
          </p>
        </div>
      </footer>
    </div>
  );
}