import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="flex mb-4 gap-2">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h1 className="text-2xl font-bold text-foreground">404 Page Not Found</h1>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                The page you're looking for doesn't exist or may have been moved.
              </p>

              <div className="mt-6">
                <Button asChild data-testid="button-home">
                  <Link to="/">
                    <Home className="h-4 w-4 mr-2" />
                    Go Back Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
