'use client';

import React, { useState } from 'react';
import Image from 'next/image';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircleIcon, 
  TrashIcon, 
  EditIcon, 
  UserIcon,
  UploadIcon,
  LinkedinIcon,
  MailIcon,
  BuildingIcon,
  CheckIcon
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

// Enhanced user interface with additional fields
interface User {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  organization: string;
  status: string;
  linkedIn?: string;
  profileImage?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
}

// Sample user data for demonstration
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'Admin',
    organization: 'City Planning',
    status: 'Active',
    linkedIn: 'https://linkedin.com/in/johndoe',
    profileImage: '/images/avatars/john-doe.jpg',
    phoneNumber: '(555) 123-4567',
    department: 'IT Department',
    position: 'IT Manager'
  },
  {
    id: '2',
    name: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    role: 'User',
    organization: 'Transportation Department',
    status: 'Active',
    linkedIn: 'https://linkedin.com/in/janesmith',
    phoneNumber: '(555) 987-6543',
    department: 'Transportation',
    position: 'Transit Planner'
  },
  {
    id: '3',
    name: 'Robert Johnson',
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert@example.com',
    role: 'User',
    organization: 'City Planning',
    status: 'Inactive',
    phoneNumber: '(555) 246-8024',
    department: 'Urban Planning',
    position: 'Urban Planner'
  }
];

export function UserManager() {
  const [users, setUsers] = useState<User[]>(sampleUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const { toast } = useToast();
  
  // State for the user form
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'User',
    organization: '',
    status: 'Active',
    linkedIn: '',
    phoneNumber: '',
    department: '',
    position: ''
  });
  
  // State for current user being edited
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // For file upload preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'User',
      organization: '',
      status: 'Active',
      linkedIn: '',
      phoneNumber: '',
      department: '',
      position: ''
    });
    setImagePreview(null);
    setCurrentUserId(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server
      // For demo, just create a URL for preview
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      // In a real implementation, you would store the file for later upload
      setFormData(prev => ({ ...prev, profileImage: imageUrl }));
    }
  };
  
  const handleAddUser = () => {
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    const newUser: User = {
      id: Math.random().toString(36).substring(2),
      name: `${formData.firstName} ${formData.lastName}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || '',
      role: formData.role || 'User',
      organization: formData.organization || '',
      status: formData.status || 'Active',
      linkedIn: formData.linkedIn,
      profileImage: formData.profileImage,
      phoneNumber: formData.phoneNumber,
      department: formData.department,
      position: formData.position
    };
    
    setUsers([...users, newUser]);
    resetForm();
    setIsAddUserOpen(false);
    
    toast({
      title: "User Added",
      description: `${newUser.name} has been added successfully.`,
      variant: "default"
    });
  };
  
  const handleEditClick = (userId: string) => {
    const userToEdit = users.find(user => user.id === userId);
    if (userToEdit) {
      setFormData({
        firstName: userToEdit.firstName || userToEdit.name.split(' ')[0],
        lastName: userToEdit.lastName || userToEdit.name.split(' ')[1] || '',
        email: userToEdit.email,
        role: userToEdit.role,
        organization: userToEdit.organization,
        status: userToEdit.status,
        linkedIn: userToEdit.linkedIn || '',
        phoneNumber: userToEdit.phoneNumber || '',
        department: userToEdit.department || '',
        position: userToEdit.position || ''
      });
      setImagePreview(userToEdit.profileImage || null);
      setCurrentUserId(userId);
      setIsEditUserOpen(true);
    }
  };
  
  const handleUpdateUser = () => {
    if (!currentUserId) return;
    
    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedUsers = users.map(user => {
      if (user.id === currentUserId) {
        return {
          ...user,
          name: `${formData.firstName} ${formData.lastName}`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || '',
          role: formData.role || 'User',
          organization: formData.organization || '',
          status: formData.status || 'Active',
          linkedIn: formData.linkedIn,
          profileImage: formData.profileImage || user.profileImage,
          phoneNumber: formData.phoneNumber,
          department: formData.department,
          position: formData.position
        };
      }
      return user;
    });
    
    setUsers(updatedUsers);
    resetForm();
    setIsEditUserOpen(false);
    
    toast({
      title: "User Updated",
      description: "User information has been updated successfully.",
      variant: "default"
    });
  };
  
  const handleDeleteUser = (userId: string) => {
    const updatedUsers = users.filter(user => user.id !== userId);
    setUsers(updatedUsers);
    
    toast({
      title: "User Deleted",
      description: "User has been deleted successfully.",
      variant: "default"
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={() => { resetForm(); setIsAddUserOpen(true); }}>
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No users found. Try a different search term.
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'Admin' ? 'default' : 'outline'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{user.organization}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex space-x-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(user.id)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user
                            and remove their data from the system.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Complete the form below to add a new user to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="firstName" className="text-right">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="lastName" className="text-right">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-right">
                Email *
              </Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="organization" className="text-right">
                Organization
              </Label>
              <div className="relative">
                <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder="Organization"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Department"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Position/Title"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Phone number"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="linkedIn">LinkedIn URL</Label>
              <div className="relative">
                <LinkedinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="linkedIn"
                  name="linkedIn"
                  value={formData.linkedIn}
                  onChange={handleInputChange}
                  placeholder="LinkedIn profile URL"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="profileImage">Profile Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                    <Image src={imagePreview} alt="Profile Preview" width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                )}
                <Label
                  htmlFor="image-upload"
                  className="cursor-pointer flex items-center gap-2 p-2 border rounded-md hover:bg-gray-100"
                >
                  <UploadIcon className="h-4 w-4" />
                  <span>Upload Image</span>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              <CheckIcon className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="editFirstName" className="text-right">
                    First Name *
                  </Label>
                  <Input
                    id="editFirstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="editLastName" className="text-right">
                    Last Name *
                  </Label>
                  <Input
                    id="editLastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            {/* Include same form fields as Add User Dialog */}
            <div className="grid gap-2">
              <Label htmlFor="editEmail" className="text-right">
                Email *
              </Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="editEmail"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editOrganization" className="text-right">
                Organization
              </Label>
              <div className="relative">
                <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="editOrganization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder="Organization"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editDepartment">Department</Label>
                <Input
                  id="editDepartment"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Department"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="editPosition">Position</Label>
                <Input
                  id="editPosition"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Position/Title"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editPhoneNumber">Phone Number</Label>
              <Input
                id="editPhoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Phone number"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editLinkedIn">LinkedIn URL</Label>
              <div className="relative">
                <LinkedinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="editLinkedIn"
                  name="linkedIn"
                  value={formData.linkedIn}
                  onChange={handleInputChange}
                  placeholder="LinkedIn profile URL"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editProfileImage">Profile Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                    <Image src={imagePreview} alt="Profile Preview" width={64} height={64} className="w-full h-full object-cover" />
                  </div>
                )}
                <Label
                  htmlFor="edit-image-upload"
                  className="cursor-pointer flex items-center gap-2 p-2 border rounded-md hover:bg-gray-100"
                >
                  <UploadIcon className="h-4 w-4" />
                  <span>Upload Image</span>
                  <Input
                    id="edit-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>
              <CheckIcon className="mr-2 h-4 w-4" />
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 