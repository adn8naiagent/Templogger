import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import Home from "@/pages/home";
import Account from "@/pages/account";
import Settings from "@/pages/settings";
import Subscribe from "@/pages/subscribe";
import SubscribeSuccess from "@/pages/subscribe/success";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminSubscriptions from "@/pages/admin/subscriptions";
import ComplianceDashboard from "@/pages/compliance-dashboard";
import TempLogger from "@/pages/temp-logger";
import AddFridge from "@/pages/add-fridge";
import ViewFridges from "@/pages/view-fridges";
import FridgeDetail from "@/pages/fridge-detail";
import EditFridge from "@/pages/edit-fridge";
import Checklists from "@/pages/checklists";
import SelfAuditChecklists from "@/pages/self-audit-checklists";
import CreateAuditTemplate from "@/pages/create-audit-template";
import CompleteSelfAudit from "@/pages/complete-self-audit";
import ViewAuditCompletion from "@/pages/view-audit-completion";
import NotFound from "@/pages/not-found";
import SecurityStatus from "@/components/security/security-status";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - accessible when not authenticated */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/signup" component={Signup} />

      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={ComplianceDashboard} />
          <Route path="/temp-logger" component={TempLogger} />
          <Route path="/add-fridge" component={AddFridge} />
          <Route path="/fridges" component={ViewFridges} />
          <Route path="/fridge/:id" component={FridgeDetail} />
          <Route path="/fridge/:id/edit" component={EditFridge} />
          <Route path="/checklists" component={Checklists} />
          <Route path="/self-audit-checklists" component={SelfAuditChecklists} />
          <Route path="/self-audit/create-template" component={CreateAuditTemplate} />
          <Route path="/self-audit/:templateId/complete" component={CompleteSelfAudit} />
          <Route path="/self-audit/completion/:completionId" component={ViewAuditCompletion} />
          <Route path="/compliance" component={ComplianceDashboard} />
          <Route path="/account" component={Account} />
          <Route path="/settings" component={Settings} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/subscribe/success" component={SubscribeSuccess} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/subscriptions" component={AdminSubscriptions} />
          <Route path="/admin" component={AdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        {/* Development-only security status widget */}
        {import.meta.env.DEV && (
          <div className="fixed bottom-4 right-4 z-50 w-80">
            <SecurityStatus />
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
