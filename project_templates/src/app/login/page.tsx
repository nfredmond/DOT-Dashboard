"use client"

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapIcon,
  LockIcon,
  MailIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);

      // Simple validation
      if (!email || !password) {
        setError("Please enter both email and password");
        return;
      }

      // In a real app, this would be an API call to authenticate
      if (email === "admin@planningmanager.org" && password === "password") {
        // Redirect to dashboard or set authenticated state
        window.location.href = "/dashboard";
      } else {
        setError("Invalid email or password");
      }
    }, 1500);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4"
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white p-2 rounded">
              <MapIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Planning Manager
              </h1>
              <p
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                Transportation Planning
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Sign in to your account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access the portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  className="flex items-center p-3 mb-4 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-md"
                >
                  <AlertCircleIcon className="h-5 w-5 mr-2" />
                  <p className="text-sm">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email
                  </Label>
                  <div className="relative">
                    <MailIcon
                      className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                      type="email"
                      placeholder="name@agency.gov"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div
                    className="flex items-center justify-between"
                  >
                    <Label htmlFor="password">
                      Password
                    </Label>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs text-muted-foreground"
                      type="button"
                      onClick={() => {
                        // In a real app, this would navigate to a password reset page
                        alert("Password reset functionality would go here");
                      }}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <div className="relative">
                    <LockIcon
                      className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />

                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me for 30 days
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div
                        className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                      />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => {
                  // In a real app, this would navigate to the register page
                  window.location.href = "/register";
                }}
              >
                Request Access
              </Button>
            </div>
            <div
              className="text-center text-xs text-muted-foreground"
            >
              By signing in, you agree to our{" "}
              <a href="#" className="underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline">
                Privacy Policy
              </a>
              .
            </div>
          </CardFooter>
        </Card>

        <div
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          <p>
            For technical support, please contact{" "}
            <a href="mailto:support@planningmanager.org" className="underline">
              support@planningmanager.org
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
