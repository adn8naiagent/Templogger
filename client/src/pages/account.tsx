// import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Download,
  Trash2,
  Shield,
  // Crown,
  Star,
  ArrowLeft,
  Lock,
  CreditCard,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  updateProfileSchema,
  type UpdateProfileData,
  resetPasswordSchema,
  type ResetPasswordData,
} from "@shared/schema";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Account() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Calculate trial days remaining
  const trialDaysRemaining = user?.trialEndDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(user.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // Profile form
  const profileForm = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  // Password form
  const passwordForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (_data: UpdateProfileData) => {
      return apiRequest("PUT", "/api/user/profile", _data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated!",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (_data: ResetPasswordData) => {
      return apiRequest("PUT", "/api/user/reset-password", { newPassword: _data.newPassword });
    },
    onSuccess: () => {
      toast({
        title: "Password updated!",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/user/account");
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      window.location.href = "/api/logout";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export data
  const handleExportData = async () => {
    try {
      const response = await fetch("/api/user/export");
      if (!response.ok) throw new Error("Failed to export data");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-data.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful!",
        description: "Your data has been downloaded.",
      });
    } catch {
      toast({
        title: "Export failed",
        description: "Failed to export your data.",
        variant: "destructive",
      });
    }
  };

  const getSubscriptionBadge = (_status: string) => {
    switch (_status) {
      case "trial":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Trial
          </Badge>
        );
      case "paid":
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="destructive">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case "user":
        return <Badge variant="outline">User</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto" data-testid="account-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <User className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-foreground">Account Management</h1>
        </div>
        <p className="text-muted-foreground">Manage your profile and account settings</p>
      </div>

      <div className="grid gap-6">
        {/* Account Status */}
        <Card data-testid="account-status-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Account Status
            </CardTitle>
            <CardDescription>Your subscription and billing information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    {user?.subscriptionStatus === "paid" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {user?.subscriptionStatus === "paid" ? "Paid Subscription" : "Free Trial"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.subscriptionStatus === "paid"
                        ? "You have access to all features"
                        : `${trialDaysRemaining} days remaining`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {user?.subscriptionStatus === "paid" ? "$10/month" : "Free"}
                  </p>
                  {user?.subscriptionStatus === "trial" && (
                    <p className="text-xs text-muted-foreground">Then $10/month</p>
                  )}
                </div>
              </div>

              {user?.subscriptionStatus === "trial" && (
                <div className="text-center pt-2">
                  <Link to="/subscribe">
                    <Button className="w-full" data-testid="button-upgrade-now">
                      <Star className="h-4 w-4 mr-2" />
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card data-testid="profile-card">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">
                        {user?.firstName?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <div className="flex gap-2 mt-1">
                      {user?.subscriptionStatus && getSubscriptionBadge(user.subscriptionStatus)}
                      {user?.role && getRoleBadge(user.role)}
                    </div>
                  </div>
                </div>
              </div>

              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit((_data) =>
                    updateProfileMutation.mutate(_data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-update-profile"
                  >
                    {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card data-testid="password-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit((_data) =>
                    resetPasswordMutation.mutate(_data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter new password"
                            {...field}
                            data-testid="input-new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirm new password"
                            {...field}
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resetPasswordMutation.isPending}
                    data-testid="button-change-password"
                  >
                    {resetPasswordMutation.isPending ? "Updating..." : "Change Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Account Actions */}
        <Card data-testid="actions-card">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Download your data or manage your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Data */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <Download className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium">Download My Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Export all your profile information and temperature logs as CSV
                  </p>
                </div>
              </div>
              <Button onClick={handleExportData} variant="outline" data-testid="button-export-data">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            {/* Account Info */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Account Details</h3>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Member since:</span>{" "}
                  {user?.createdAt && new Date(user.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="text-muted-foreground">Last updated:</span>{" "}
                  {user?.updatedAt && new Date(user.updatedAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="text-muted-foreground">User ID:</span> {user?._id}
                </p>
              </div>
            </div>

            {/* Danger Zone */}
            <Alert variant="destructive">
              <Trash2 className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm">Permanently delete your account and all data</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" data-testid="button-delete-account">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers including:
                          <br />
                          <br />
                          • All your fridges and temperature logs
                          <br />
                          • Your profile information
                          <br />• Your subscription and billing history
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteAccountMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-testid="button-confirm-delete"
                        >
                          {deleteAccountMutation.isPending
                            ? "Deleting..."
                            : "Yes, delete my account"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
