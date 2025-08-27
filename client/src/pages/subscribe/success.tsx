import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function SubscribeSuccess() {
  const { user, refetch } = useAuth();
  const [countdown, setCountdown] = useState(3);

  // Refetch user data to get updated subscription status
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetch]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="subscribe-success-page">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-yellow-500" />
            Welcome to FridgeSafe Pro!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-lg font-semibold text-green-600 mb-2">
              Payment Successful!
            </p>
            <p className="text-muted-foreground">
              Your subscription has been activated. You now have access to all Pro features.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What&apos;s included:</h3>
            <ul className="text-sm text-left space-y-1">
              <li>✓ Unlimited refrigerator monitoring</li>
              <li>✓ Advanced temperature alerts</li>
              <li>✓ Complete data export capabilities</li>
              <li>✓ Priority customer support</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link to="/">
              <Button className="w-full" data-testid="button-go-dashboard">
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
            
            <Link to="/account">
              <Button variant="outline" className="w-full" data-testid="button-view-account">
                View Account Details
              </Button>
            </Link>
          </div>

          {user?.subscriptionStatus !== 'paid' && (
            <p className="text-xs text-muted-foreground">
              Updating your account... {countdown > 0 && `(${countdown}s)`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}