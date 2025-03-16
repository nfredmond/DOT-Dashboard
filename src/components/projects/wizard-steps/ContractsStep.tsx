import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
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
  TableCaption,
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText,
  Upload
} from 'lucide-react';
import { ProjectContract, ContractAmendment } from '@/types/project';

interface ContractsStepProps {
  projectData: any;
  onSave: (data: any) => void;
  errors?: Record<string, string>;
}

const ContractsStep: React.FC<ContractsStepProps> = ({ 
  projectData, 
  onSave, 
  errors 
}) => {
  const [contracts, setContracts] = useState<ProjectContract[]>(
    projectData.contracts || []
  );
  
  const [isAddingContract, setIsAddingContract] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [currentContract, setCurrentContract] = useState<ProjectContract | null>(null);
  const [currentContractIndex, setCurrentContractIndex] = useState<number | null>(null);
  
  const [isAddingAmendment, setIsAddingAmendment] = useState(false);
  const [currentAmendment, setCurrentAmendment] = useState<ContractAmendment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Default empty contract
  const emptyContract: ProjectContract = {
    id: `contract-${Date.now()}`,
    name: '',
    contractor: '',
    contractNumber: '',
    amount: 0,
    startDate: '',
    endDate: '',
    status: 'pending',
    amendments: [],
    documents: [],
  };
  
  // Default empty amendment
  const emptyAmendment: ContractAmendment = {
    id: `amendment-${Date.now()}`,
    number: 1,
    description: '',
    amount: 0,
    approvalDate: '',
  };
  
  useEffect(() => {
    // Save contracts data whenever it changes
    onSave({ contracts });
  }, [contracts, onSave]);
  
  const handleAddContract = () => {
    setCurrentContract({ ...emptyContract, id: `contract-${Date.now()}` });
    setIsAddingContract(true);
  };
  
  const handleEditContract = (index: number) => {
    setCurrentContract({ ...contracts[index] });
    setCurrentContractIndex(index);
    setIsEditingContract(true);
  };
  
  const handleDeleteContract = (index: number) => {
    const updatedContracts = [...contracts];
    updatedContracts.splice(index, 1);
    setContracts(updatedContracts);
  };
  
  const handleContractChange = (field: string, value: any) => {
    if (currentContract) {
      setCurrentContract({
        ...currentContract,
        [field]: value
      });
    }
  };
  
  const handleSaveContract = () => {
    if (!currentContract) return;
    
    // Validation
    if (!currentContract.name || !currentContract.contractor || !currentContract.contractNumber) {
      // Show error or handle validation
      return;
    }
    
    const updatedContracts = [...contracts];
    
    if (isEditingContract && currentContractIndex !== null) {
      // Update existing contract
      updatedContracts[currentContractIndex] = currentContract;
    } else {
      // Add new contract
      updatedContracts.push(currentContract);
    }
    
    setContracts(updatedContracts);
    closeContractModal();
  };
  
  const closeContractModal = () => {
    setIsAddingContract(false);
    setIsEditingContract(false);
    setCurrentContract(null);
    setCurrentContractIndex(null);
  };
  
  const handleAddAmendment = (contractIndex: number) => {
    if (contracts[contractIndex]) {
      const nextAmendmentNumber = contracts[contractIndex].amendments?.length 
        ? Math.max(...contracts[contractIndex].amendments!.map(a => a.number)) + 1 
        : 1;
      
      setCurrentAmendment({ 
        ...emptyAmendment, 
        id: `amendment-${Date.now()}`,
        number: nextAmendmentNumber
      });
      setCurrentContractIndex(contractIndex);
      setIsAddingAmendment(true);
    }
  };
  
  const handleAmendmentChange = (field: string, value: any) => {
    if (currentAmendment) {
      setCurrentAmendment({
        ...currentAmendment,
        [field]: value
      });
    }
  };
  
  const handleSaveAmendment = () => {
    if (!currentAmendment || currentContractIndex === null) return;
    
    // Validation
    if (!currentAmendment.description || !currentAmendment.approvalDate) {
      // Show error or handle validation
      return;
    }
    
    const updatedContracts = [...contracts];
    const contract = updatedContracts[currentContractIndex];
    
    // Create amendments array if it doesn't exist
    if (!contract.amendments) {
      contract.amendments = [];
    }
    
    // Add the amendment
    contract.amendments.push(currentAmendment);
    
    // Update contract with amendment effects
    if (currentAmendment.amount) {
      contract.amount += currentAmendment.amount;
    }
    
    if (currentAmendment.newEndDate) {
      contract.endDate = currentAmendment.newEndDate;
    }
    
    setContracts(updatedContracts);
    closeAmendmentModal();
  };
  
  const closeAmendmentModal = () => {
    setIsAddingAmendment(false);
    setCurrentAmendment(null);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUploadDocument = (contractIndex: number) => {
    if (!selectedFile || currentContractIndex === null) return;
    
    // In a real implementation, this would upload to storage
    // For now, just add a reference to the document in the contract
    const updatedContracts = [...contracts];
    const contract = updatedContracts[contractIndex];
    
    // Create documents array if it doesn't exist
    if (!contract.documents) {
      contract.documents = [];
    }
    
    // Add document reference
    contract.documents.push(`document-${Date.now()}`);
    
    setContracts(updatedContracts);
    setSelectedFile(null);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Contracts & Agreements</CardTitle>
          <CardDescription>
            Manage construction contracts, professional service agreements, and amendments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Project Contracts</h3>
              <Button onClick={handleAddContract} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Contract
              </Button>
            </div>
            
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No contracts have been added yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract, index) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.name}</TableCell>
                      <TableCell>{contract.contractor}</TableCell>
                      <TableCell>{contract.contractNumber}</TableCell>
                      <TableCell>${contract.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          contract.status === 'active' ? 'bg-green-100 text-green-800' :
                          contract.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          contract.status === 'terminated' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContract(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContract(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddAmendment(index)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Contract Modal */}
      <Dialog 
        open={isAddingContract || isEditingContract} 
        onOpenChange={isOpen => {
          if (!isOpen) closeContractModal();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingContract ? 'Edit Contract' : 'Add New Contract'}
            </DialogTitle>
            <DialogDescription>
              {isEditingContract 
                ? 'Update contract details and information' 
                : 'Enter details for the new contract or agreement'}
            </DialogDescription>
          </DialogHeader>
          
          {currentContract && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Contract Name</Label>
                  <Input
                    id="name"
                    value={currentContract.name}
                    onChange={(e) => handleContractChange('name', e.target.value)}
                    placeholder="e.g., Main Street Bridge Construction"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contractor">Contractor</Label>
                  <Input
                    id="contractor"
                    value={currentContract.contractor}
                    onChange={(e) => handleContractChange('contractor', e.target.value)}
                    placeholder="Contractor company name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contractNumber">Contract Number</Label>
                  <Input
                    id="contractNumber"
                    value={currentContract.contractNumber}
                    onChange={(e) => handleContractChange('contractNumber', e.target.value)}
                    placeholder="e.g., CT-2023-123"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Contract Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={currentContract.amount}
                      onChange={(e) => handleContractChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={currentContract.status}
                      onValueChange={(value) => handleContractChange('status', value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={currentContract.startDate}
                      onChange={(e) => handleContractChange('startDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={currentContract.endDate}
                      onChange={(e) => handleContractChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentContract.description || ''}
                    onChange={(e) => handleContractChange('description', e.target.value)}
                    placeholder="Contract scope and general description"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeContractModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveContract}>
              {isEditingContract ? 'Update Contract' : 'Add Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Amendment Modal */}
      <Dialog 
        open={isAddingAmendment} 
        onOpenChange={isOpen => {
          if (!isOpen) closeAmendmentModal();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Contract Amendment</DialogTitle>
            <DialogDescription>
              Enter details for the contract amendment
            </DialogDescription>
          </DialogHeader>
          
          {currentAmendment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amendmentNumber">Amendment #</Label>
                    <Input
                      id="amendmentNumber"
                      type="number"
                      value={currentAmendment.number}
                      onChange={(e) => handleAmendmentChange('number', parseInt(e.target.value) || 1)}
                      placeholder="1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="approvalDate">Approval Date</Label>
                    <Input
                      id="approvalDate"
                      type="date"
                      value={currentAmendment.approvalDate}
                      onChange={(e) => handleAmendmentChange('approvalDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentAmendment.description}
                    onChange={(e) => handleAmendmentChange('description', e.target.value)}
                    placeholder="Describe the changes in this amendment"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount Change ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={currentAmendment.amount}
                      onChange={(e) => handleAmendmentChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    <FormDescription>Use negative values for reductions</FormDescription>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newEndDate">New End Date (if extended)</Label>
                    <Input
                      id="newEndDate"
                      type="date"
                      value={currentAmendment.newEndDate || ''}
                      onChange={(e) => handleAmendmentChange('newEndDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeAmendmentModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveAmendment}>
              Add Amendment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractsStep; 