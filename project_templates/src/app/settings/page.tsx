"use client"

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SettingsIcon,
  UserIcon,
  BellIcon,
  ShieldIcon,
  GlobeIcon,
} from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-bold tracking-tight flex items-center"
        >
          <SettingsIcon className="mr-2 h-8 w-8 text-blue-500" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account preferences and system settings
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">
            <UserIcon className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellIcon className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <ShieldIcon className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <GlobeIcon className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Manage your personal information and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p
                className="text-center py-20 text-muted-foreground"
              >
                Account settings would be displayed here.
              </p>
              <Button className="w-full">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="notifications"
          className="space-y-4 mt-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p
                className="text-center py-20 text-muted-foreground"
              >
                Notification settings would be displayed here.
              </p>
              <Button className="w-full">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Manage your privacy preferences and data sharing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p
                className="text-center py-20 text-muted-foreground"
              >
                Privacy settings would be displayed here.
              </p>
              <Button className="w-full">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p
                className="text-center py-20 text-muted-foreground"
              >
                Appearance settings would be displayed here.
              </p>
              <Button className="w-full">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
