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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UsersIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  MoreHorizontalIcon,
  ShieldIcon,
  CheckIcon,
  XIcon,
  UserIcon,
  MailIcon,
  BuildingIcon,
  KeyIcon,
  RefreshCwIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  status: string;
  avatar: string;
  lastActive: string | null;
}

export default function UserManagement() {
  const [_activeTab, setActiveTab] = useState("all-users");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Mock data for users
  const users = [
    {
      id: "1",
      name: "Alex Johnson",
      email: "alex.johnson@caltrans.gov",
      avatar: "https://github.com/yusufhilmi.png",
      role: "Administrator",
      organization: "Caltrans",
      status: "Active",
      lastActive: "2023-07-25T14:32:00",
    },
    {
      id: "2",
      name: "Maria Rodriguez",
      email: "maria.rodriguez@planningmanager.org",
      avatar: "https://github.com/furkanksl.png",
      role: "Planner",
      organization: "Sacramento Area Council of Governments",
      status: "Active",
      lastActive: "2023-07-25T11:15:00",
    },
    {
      id: "3",
      name: "David Chen",
      email: "david.chen@dot.ca.gov",
      avatar: "https://github.com/identicons/app.png",
      role: "Engineer",
      organization: "California Department of Transportation",
      status: "Active",
      lastActive: "2023-07-24T16:45:00",
    },
    {
      id: "4",
      name: "Sarah Wilson",
      email: "sarah.wilson@agency.gov",
      avatar: "https://github.com/yusufhilmi.png",
      role: "Manager",
      organization: "Bay Area Metropolitan Transportation Commission",
      status: "Inactive",
      lastActive: "2023-07-10T10:20:00",
    },
    {
      id: "5",
      name: "James Taylor",
      email: "james.taylor@agency.gov",
      avatar: "https://github.com/furkanksl.png",
      role: "Analyst",
      organization: "Southern California Association of Governments",
      status: "Active",
      lastActive: "2023-07-23T15:10:00",
    },
    {
      id: "6",
      name: "Emily Davis",
      email: "emily.davis@planningmanager.org",
      avatar: "https://github.com/identicons/app.png",
      role: "Community Member",
      organization: "Public",
      status: "Pending",
      lastActive: null,
    },
  ];

  // Mock data for pending approvals
  const pendingApprovals = [
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@agency.gov",
      organization: "Caltrans District 4",
      role: "Planner",
      requestDate: "2023-07-25",
    },
    {
      id: "2",
      name: "Emily Johnson",
      email: "emily.johnson@planningmanager.org",
      organization: "Sacramento Area Council of Governments",
      role: "Manager",
      requestDate: "2023-07-24",
    },
    {
      id: "3",
      name: "Michael Chen",
      email: "michael.chen@dot.ca.gov",
      organization: "California Department of Transportation",
      role: "Engineer",
      requestDate: "2023-07-23",
    },
  ];

  // Filter users based on search query, role, and status
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.organization.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      filterRole === "all" ||
      user.role.toLowerCase() === filterRole.toLowerCase();

    const matchesStatus =
      filterStatus === "all" ||
      user.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handler functions
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUserDialog(true);
  };

  const handleResetPassword = (_userId: string) => {
    // In a real app, this would trigger a password reset flow
    alert("Password reset email sent");
  };

  const handleDeleteUser = (_userId: string) => {
    // In a real app, this would show a confirmation dialog and then delete the user
    alert("User deleted");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrator":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Manager":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Planner":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Engineer":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Analyst":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300";
      case "Community Member":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-bold tracking-tight flex items-center"
        >
          <UsersIcon className="mr-2 h-8 w-8 text-blue-500" />
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      <Tabs
        defaultValue="all-users"
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-users">
            All Users
          </TabsTrigger>
          <TabsTrigger value="pending-approvals">
            Pending Approvals
            <Badge
              className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
            >
              {pendingApprovals.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="roles-permissions">
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-users" className="space-y-4">
          <Card>
            <CardHeader>
              <div
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <CardTitle>User Accounts</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <SearchIcon
                      className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                      placeholder="Search users..."
                      className="pl-8 w-full sm:w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    defaultValue="all"
                    onValueChange={setFilterRole}
                    value={filterRole}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Roles
                      </SelectItem>
                      <SelectItem value="administrator">
                        Administrator
                      </SelectItem>
                      <SelectItem value="manager">
                        Manager
                      </SelectItem>
                      <SelectItem value="planner">
                        Planner
                      </SelectItem>
                      <SelectItem value="engineer">
                        Engineer
                      </SelectItem>
                      <SelectItem value="analyst">
                        Analyst
                      </SelectItem>
                      <SelectItem value="community member">
                        Community Member
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    defaultValue="all"
                    onValueChange={setFilterStatus}
                    value={filterStatus}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Statuses
                      </SelectItem>
                      <SelectItem value="active">
                        Active
                      </SelectItem>
                      <SelectItem value="inactive">
                        Inactive
                      </SelectItem>
                      <SelectItem value="pending">
                        Pending
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <FilterIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setShowAddUserDialog(true)}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      User
                    </TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow key={user.id} id={`zcvwjx_${index}`}>
                      <TableCell id={`xdbzby_${index}`}>
                        <div
                          className="flex items-center space-x-3"
                          id={`mdqdo3_${index}`}
                        >
                          <Avatar id={`enr99a_${index}`}>
                            <AvatarImage
                              src={user.avatar}
                              alt={user.name}
                              id={`tctsmj_${index}`}
                            />
                            <AvatarFallback id={`ofcwll_${index}`}>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div id={`ka1vx9_${index}`}>
                            <p className="font-medium" id={`pepudj_${index}`}>
                              {user.name}
                            </p>
                            <p
                              className="text-sm text-muted-foreground"
                              id={`6bskdm_${index}`}
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell id={`rcadmr_${index}`}>
                        <Badge
                          className={getRoleColor(user.role)}
                          id={`h2dfkc_${index}`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell id={`5u96nf_${index}`}>
                        {user.organization}
                      </TableCell>
                      <TableCell id={`8euodd_${index}`}>
                        <Badge
                          className={getStatusColor(user.status)}
                          id={`6psgha_${index}`}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell id={`y3rxnl_${index}`}>
                        {user.lastActive
                          ? new Date(user.lastActive).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right" id={`fccjir_${index}`}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResetPassword(user.id)}
                            >
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent
          value="pending-approvals"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Pending Account Approvals</CardTitle>
              <CardDescription>
                Review and approve new user registration requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.length === 0 ? (
                  <div
                    className="text-center py-8 text-muted-foreground"
                  >
                    No pending approvals at this time.
                  </div>
                ) : (
                  pendingApprovals.map((approval, index) => (
                    <div
                      key={approval.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/50 rounded-md"
                      id={`83gtgm_${index}`}
                    >
                      <div className="mb-3 sm:mb-0" id={`rtxwb5_${index}`}>
                        <p className="font-medium" id={`sl4oya_${index}`}>
                          {approval.name}
                        </p>
                        <p
                          className="text-sm text-muted-foreground"
                          id={`3i9nzk_${index}`}
                        >
                          {approval.email}
                        </p>
                        <div
                          className="flex items-center mt-1"
                          id={`jpfkvf_${index}`}
                        >
                          <Badge
                            variant="outline"
                            className={getRoleColor(approval.role)}
                            id={`1mtdp4_${index}`}
                          >
                            {approval.role}
                          </Badge>
                          <span
                            className="text-xs text-muted-foreground ml-2"
                            id={`8kjzyy_${index}`}
                          >
                            {approval.organization}
                          </span>
                        </div>
                        <p
                          className="text-xs text-muted-foreground mt-1"
                          id={`jk263b_${index}`}
                        >
                          Requested:{" "}
                          {new Date(approval.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className="flex space-x-2 self-end sm:self-auto"
                        id={`kqw1dm_${index}`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-red-500"
                          id={`i16gfy_${index}`}
                        >
                          <XIcon
                            className="h-4 w-4 mr-1"
                            id={`m4rgyn_${index}`}
                          />
                          Deny
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-2"
                          id={`dukmvl_${index}`}
                        >
                          <CheckIcon
                            className="h-4 w-4 mr-1"
                            id={`3ahbkh_${index}`}
                          />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="roles-permissions"
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <div
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <CardTitle>Roles & Permissions</CardTitle>
                  <CardDescription>
                    Manage system roles and their associated permissions
                  </CardDescription>
                </div>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create New Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      Role
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <ShieldIcon
                          className="h-4 w-4 text-red-500"
                        />
                        <span className="font-medium">
                          Administrator
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      Full system access with ability to manage users, settings,
                      and all content
                    </TableCell>
                    <TableCell>2</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <ShieldIcon
                          className="h-4 w-4 text-purple-500"
                        />
                        <span className="font-medium">
                          Manager
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      Can manage projects, reports, and view analytics, but
                      cannot modify system settings
                    </TableCell>
                    <TableCell>3</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <ShieldIcon
                          className="h-4 w-4 text-blue-500"
                        />
                        <span className="font-medium">
                          Planner
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      Can create and edit projects, generate reports, and use
                      planning tools
                    </TableCell>
                    <TableCell>5</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <ShieldIcon
                          className="h-4 w-4 text-orange-500"
                        />
                        <span className="font-medium">
                          Engineer
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      Can create and edit technical project details and access
                      specialized engineering tools
                    </TableCell>
                    <TableCell>4</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <ShieldIcon
                          className="h-4 w-4 text-teal-500"
                        />
                        <span className="font-medium">
                          Analyst
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      Can view and analyze projects, generate reports, but
                      cannot modify project data
                    </TableCell>
                    <TableCell>3</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <ShieldIcon
                          className="h-4 w-4 text-green-500"
                        />
                        <span className="font-medium">
                          Community Member
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      Limited access to public projects and ability to provide
                      feedback
                    </TableCell>
                    <TableCell>12</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Dialog */}
      <Dialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account and assign roles
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium"
                >
                  First Name
                </label>
                <div className="relative">
                  <UserIcon
                    className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  />
                  <Input placeholder="John" className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium"
                >
                  Last Name
                </label>
                <div className="relative">
                  <UserIcon
                    className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  />
                  <Input placeholder="Doe" className="pl-10" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium"
              >
                Email
              </label>
              <div className="relative">
                <MailIcon
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                />
                <Input
                  type="email"
                  placeholder="john.doe@agency.gov"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="organization"
                className="text-sm font-medium"
              >
                Organization
              </label>
              <div className="relative">
                <BuildingIcon
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                />
                <Input
                  placeholder="Caltrans"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <Select defaultValue="planner">
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">
                    Administrator
                  </SelectItem>
                  <SelectItem value="manager">
                    Manager
                  </SelectItem>
                  <SelectItem value="planner">
                    Planner
                  </SelectItem>
                  <SelectItem value="engineer">
                    Engineer
                  </SelectItem>
                  <SelectItem value="analyst">
                    Analyst
                  </SelectItem>
                  <SelectItem value="community">
                    Community Member
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium"
              >
                Temporary Password
              </label>
              <div className="relative">
                <KeyIcon
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                />
                <Input
                  type="text"
                  placeholder="Generate or enter password"
                  className="pl-10"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8"
                >
                  <RefreshCwIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                User will be prompted to change password on first login
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddUserDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={showEditUserDialog}
        onOpenChange={setShowEditUserDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Modify user details and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                  />

                  <AvatarFallback>
                    {selectedUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {selectedUser.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="editFirstName"
                    className="text-sm font-medium"
                  >
                    First Name
                  </label>
                  <Input
                    defaultValue={selectedUser.name.split(" ")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="editLastName"
                    className="text-sm font-medium"
                  >
                    Last Name
                  </label>
                  <Input
                    defaultValue={selectedUser.name.split(" ")[1] || ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="editEmail"
                  className="text-sm font-medium"
                >
                  Email
                </label>
                <Input defaultValue={selectedUser.email} />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="editOrganization"
                  className="text-sm font-medium"
                >
                  Organization
                </label>
                <Input
                  defaultValue={selectedUser.organization}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="editRole"
                  className="text-sm font-medium"
                >
                  Role
                </label>
                <Select
                  defaultValue={selectedUser.role.toLowerCase()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">
                      Administrator
                    </SelectItem>
                    <SelectItem value="manager">
                      Manager
                    </SelectItem>
                    <SelectItem value="planner">
                      Planner
                    </SelectItem>
                    <SelectItem value="engineer">
                      Engineer
                    </SelectItem>
                    <SelectItem value="analyst">
                      Analyst
                    </SelectItem>
                    <SelectItem value="community member">
                      Community Member
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="editStatus"
                  className="text-sm font-medium"
                >
                  Status
                </label>
                <Select
                  defaultValue={selectedUser.status.toLowerCase()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      Active
                    </SelectItem>
                    <SelectItem value="inactive">
                      Inactive
                    </SelectItem>
                    <SelectItem value="pending">
                      Pending
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                >
                  <KeyIcon className="mr-2 h-4 w-4" />
                  Reset Password
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditUserDialog(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
