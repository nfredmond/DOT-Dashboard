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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapIcon,
  UserIcon,
  MailIcon,
  BuildingIcon,
  PhoneIcon,
  AlertCircleIcon,
  CheckIcon,
} from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    role: "",
    phone: "",
    agreeTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, agreeTerms: checked }));
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.organization ||
      !formData.role
    ) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    if (!formData.agreeTerms) {
      setError("You must agree to the terms and conditions");
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1500);
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
                RTPA Portal
              </h1>
              <p
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                Transportation Planning
              </p>
            </div>
          </div>
        </div>

        {success ? (
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Registration Successful
              </CardTitle>
              <CardDescription className="text-center">
                Your account request has been submitted
              </CardDescription>
            </CardHeader>
            <CardContent
              className="flex flex-col items-center justify-center space-y-4 pt-6"
            >
              <div
                className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"
              >
                <CheckIcon
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                />
              </div>
              <p className="text-center">
                Thank you for registering with the RTPA Portal. Your account
                request has been submitted and is pending approval by an
                administrator. You will receive an email notification once your
                account is approved.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => {
                  window.location.href = "/login";
                }}
              >
                Return to Login
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                Create an Account
              </CardTitle>
              <CardDescription className="text-center">
                Register for access to the RTPA Portal
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

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name
                    </Label>
                    <div className="relative">
                      <UserIcon
                        className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                      />
                      <Input
                        name="firstName"
                        placeholder="John"
                        className="pl-10"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name
                    </Label>
                    <div className="relative">
                      <UserIcon
                        className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                      />
                      <Input
                        name="lastName"
                        placeholder="Doe"
                        className="pl-10"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="email">
                    Email
                  </Label>
                  <div className="relative">
                    <MailIcon
                      className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                      name="email"
                      type="email"
                      placeholder="john.doe@agency.gov"
                      className="pl-10"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Password
                    </Label>
                    <Input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm Password
                    </Label>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="organization">
                    Organization
                  </Label>
                  <div className="relative">
                    <BuildingIcon
                      className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                      name="organization"
                      placeholder="Caltrans"
                      className="pl-10"
                      value={formData.organization}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">
                      Role
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={handleSelectChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planner">
                          Planner
                        </SelectItem>
                        <SelectItem value="engineer">
                          Engineer
                        </SelectItem>
                        <SelectItem value="manager">
                          Manager
                        </SelectItem>
                        <SelectItem value="analyst">
                          Analyst
                        </SelectItem>
                        <SelectItem value="administrator">
                          Administrator
                        </SelectItem>
                        <SelectItem value="community">
                          Community Member
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone (Optional)
                    </Label>
                    <div className="relative">
                      <PhoneIcon
                        className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                      />
                      <Input
                        name="phone"
                        placeholder="(555) 123-4567"
                        className="pl-10"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <Checkbox
                    checked={formData.agreeTerms}
                    onCheckedChange={handleCheckboxChange}
                    required
                  />

                  <Label
                    htmlFor="terms"
                    className="text-sm font-normal cursor-pointer"
                  >
                    I agree to the{" "}
                    <a
                      href="#"
                      className="text-blue-600 hover:underline"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div
                        className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                      />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Already have an account?{" "}
                </span>
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => {
                    window.location.href = "/login";
                  }}
                >
                  Sign in
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        <div
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          <p>
            For technical support, please contact{" "}
            <a href="mailto:support@rtpa.gov" className="underline">
              support@rtpa.gov
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
