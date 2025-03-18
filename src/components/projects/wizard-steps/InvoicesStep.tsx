import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';


import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';
import { ProjectInvoice } from '@/types/project';

interface InvoicesStepProps {
  projectData: any;
  onSave: (data: any) => void;
  errors?: Record<string, string>;
}

const InvoicesStep: React.FC<InvoicesStepProps> = ({ 
  projectData, 
  onSave, 
  errors 
}) => {
  const [invoices, setInvoices] = useState<ProjectInvoice[]>(
    projectData.invoices || []
  );
  
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<ProjectInvoice | null>(null);
  const [currentInvoiceIndex, setCurrentInvoiceIndex] = useState<number | null>(null);
  const [_selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Default empty invoice
  const emptyInvoice: ProjectInvoice = {
    id: `invoice-${Date.now()}`,
    invoiceNumber: '',
    vendor: '',
    amount: 0,
    date: '',
    description: '',
    status: 'pending',
    category: 'construction',
    documents: [],
  };
  
  // Statistics
  const totalInvoiced = invoices.reduce((total, invoice) => total + invoice.amount, 0);
  const totalPaid = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((total, invoice) => total + invoice.amount, 0);
  const totalPending = invoices
    .filter(invoice => invoice.status === 'pending')
    .reduce((total, invoice) => total + invoice.amount, 0);
  
  useEffect(() => {
    // Save invoices data whenever it changes
    onSave({ invoices });
  }, [invoices, onSave]);
  
  const handleAddInvoice = () => {
    setCurrentInvoice({ ...emptyInvoice, id: `invoice-${Date.now()}` });
    setIsAddingInvoice(true);
  };
  
  const handleEditInvoice = (index: number) => {
    setCurrentInvoice({ ...invoices[index] });
    setCurrentInvoiceIndex(index);
    setIsEditingInvoice(true);
  };
  
  const handleDeleteInvoice = (index: number) => {
    const updatedInvoices = [...invoices];
    updatedInvoices.splice(index, 1);
    setInvoices(updatedInvoices);
  };
  
  const handleInvoiceChange = (field: string, value: any) => {
    if (currentInvoice) {
      setCurrentInvoice({
        ...currentInvoice,
        [field]: value
      });
    }
  };
  
  const handleSaveInvoice = () => {
    if (!currentInvoice) return;
    
    // Validation
    if (!currentInvoice.invoiceNumber || !currentInvoice.vendor || !currentInvoice.amount || !currentInvoice.date) {
      // Show error or handle validation
      return;
    }
    
    const updatedInvoices = [...invoices];
    
    if (isEditingInvoice && currentInvoiceIndex !== null) {
      // Update existing invoice
      updatedInvoices[currentInvoiceIndex] = currentInvoice;
    } else {
      // Add new invoice
      updatedInvoices.push(currentInvoice);
    }
    
    setInvoices(updatedInvoices);
    closeInvoiceModal();
  };
  
  const closeInvoiceModal = () => {
    setIsAddingInvoice(false);
    setIsEditingInvoice(false);
    setCurrentInvoice(null);
    setCurrentInvoiceIndex(null);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleMarkAsPaid = (index: number) => {
    const updatedInvoices = [...invoices];
    const invoice = { ...updatedInvoices[index] };
    
    invoice.status = 'paid';
    invoice.paymentDate = new Date().toISOString().split('T')[0];
    
    updatedInvoices[index] = invoice;
    setInvoices(updatedInvoices);
  };
  
  const handleMarkAsApproved = (index: number) => {
    const updatedInvoices = [...invoices];
    const invoice = { ...updatedInvoices[index] };
    
    invoice.status = 'approved';
    
    updatedInvoices[index] = invoice;
    setInvoices(updatedInvoices);
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Invoices & Payments</CardTitle>
          <CardDescription>
            Track project invoices, payments, and expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Invoiced</span>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-2xl font-bold mt-2">${totalInvoiced.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Total Paid</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold mt-2">${totalPaid.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-600">Pending Payment</span>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold mt-2">${totalPending.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600">Total Invoices</span>
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold mt-2">{invoices.length}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Project Invoices</h3>
              <Button onClick={handleAddInvoice} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Invoice
              </Button>
            </div>
            
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invoices have been added yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice, index) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.vendor}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className="capitalize">{invoice.category}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(invoice.status)}`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditInvoice(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInvoice(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsApproved(index)}
                              className="text-blue-600"
                            >
                              Approve
                            </Button>
                          )}
                          {invoice.status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsPaid(index)}
                              className="text-green-600"
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Invoice Modal */}
      <Dialog 
        open={isAddingInvoice || isEditingInvoice} 
        onOpenChange={isOpen => {
          if (!isOpen) closeInvoiceModal();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingInvoice ? 'Edit Invoice' : 'Add New Invoice'}
            </DialogTitle>
            <DialogDescription>
              {isEditingInvoice 
                ? 'Update invoice details and information' 
                : 'Enter details for the new invoice'}
            </DialogDescription>
          </DialogHeader>
          
          {currentInvoice && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input
                      id="invoiceNumber"
                      value={currentInvoice.invoiceNumber}
                      onChange={(e) => handleInvoiceChange('invoiceNumber', e.target.value)}
                      placeholder="e.g., INV-12345"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor/Contractor</Label>
                    <Input
                      id="vendor"
                      value={currentInvoice.vendor}
                      onChange={(e) => handleInvoiceChange('vendor', e.target.value)}
                      placeholder="Vendor name"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={currentInvoice.amount}
                      onChange={(e) => handleInvoiceChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Invoice Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={currentInvoice.date}
                      onChange={(e) => handleInvoiceChange('date', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={currentInvoice.dueDate || ''}
                      onChange={(e) => handleInvoiceChange('dueDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={currentInvoice.category}
                      onValueChange={(value) => handleInvoiceChange('category', value)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="rightOfWay">Right of Way</SelectItem>
                        <SelectItem value="environmental">Environmental</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fundingSource">Funding Source</Label>
                  <Input
                    id="fundingSource"
                    value={currentInvoice.fundingSource || ''}
                    onChange={(e) => handleInvoiceChange('fundingSource', e.target.value)}
                    placeholder="e.g., Grant #123, Local Funds, etc."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentInvoice.description || ''}
                    onChange={(e) => handleInvoiceChange('description', e.target.value)}
                    placeholder="Invoice description or notes"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={currentInvoice.status}
                    onValueChange={(value) => handleInvoiceChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {currentInvoice.status === 'paid' && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={currentInvoice.paymentDate || ''}
                      onChange={(e) => handleInvoiceChange('paymentDate', e.target.value)}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="fileUpload">Upload Invoice Document</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload invoice document (PDF, Word, Image)
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeInvoiceModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveInvoice}>
              {isEditingInvoice ? 'Update Invoice' : 'Add Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesStep; 