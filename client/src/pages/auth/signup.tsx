import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { signUpSchema, type SignUpData } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignUpData) => {
      return apiRequest("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Account created!",
        description: "Welcome! Your account has been created successfully.",
      });
      queryClient.invalidateQueries();
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignUpData) => {
    signupMutation.mutate(data);
  };

  const password = form.watch("password");
  const [showPassword, setShowPassword] = useState(false);
  
  const passwordStrength = {
    hasLength: password?.length >= 8,
    hasUpper: /[A-Z]/.test(password || ""),
    hasLower: /[a-z]/.test(password || ""),
    hasNumber: /\d/.test(password || ""),
    hasSymbol: /[@$!%*?&]/.test(password || ""),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" data-testid="signup-container">
      <Card className="w-full max-w-md" data-testid="signup-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center" data-testid="signup-title">
            Create Account
          </CardTitle>
          <CardDescription className="text-center" data-testid="signup-description">
            Enter your details to create a new account
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} data-testid="signup-form">
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John"
                          data-testid="input-firstname"
                          disabled={signupMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
                          data-testid="input-lastname"
                          disabled={signupMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john@example.com"
                        data-testid="input-email"
                        disabled={signupMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter a strong password"
                          data-testid="input-password"
                          disabled={signupMutation.isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    
                    {password && (
                      <div className="space-y-1 text-xs" data-testid="password-requirements">
                        <div className={`flex items-center space-x-1 ${passwordStrength.hasLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordStrength.hasLength ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 border rounded-full" />}
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${passwordStrength.hasUpper ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordStrength.hasUpper ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 border rounded-full" />}
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${passwordStrength.hasLower ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordStrength.hasLower ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 border rounded-full" />}
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordStrength.hasNumber ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 border rounded-full" />}
                          <span>One number</span>
                        </div>
                        <div className={`flex items-center space-x-1 ${passwordStrength.hasSymbol ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordStrength.hasSymbol ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 border rounded-full" />}
                          <span>One symbol (@$!%*?&)</span>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {signupMutation.isError && (
                <Alert variant="destructive" data-testid="signup-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {signupMutation.error?.message || "An error occurred during sign up"}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
                data-testid="button-submit"
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline" data-testid="link-login">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}