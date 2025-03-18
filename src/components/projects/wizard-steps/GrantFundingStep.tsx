import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
} from '@/components/ui/card';


import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Edit, 
  Trash2,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react';
import { GrantFunding } from '@/types/project';

interface GrantFundingStepProps {
  projectData: any;
  onSave: (data: any) => void;
  errors?: Record<string, string>;
}

const GrantFundingStep: React.FC<GrantFundingStepProps> = ({ 
  projectData, 
  onSave, 
  errors 
}) => {
  const [grants, setGrants] = useState<GrantFunding[]>(
    projectData.grantFunding || []
  );
  
  const [isAddingGrant, setIsAddingGrant] = useState(false);
  const [isEditingGrant, setIsEditingGrant] = useState(false);
  const [currentGrant, setCurrentGrant] = useState<GrantFunding | null>(null);
  const [currentGrantIndex, setCurrentGrantIndex] = useState<number | null>(null);
  const [_selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Default empty grant
  const emptyGrant: GrantFunding = {
    id: `grant-${Date.now()}`,
    name: '',
    grantNumber: '',
    amount: 0,
    amountSpent: 0,
    agency: '',
    status: 'pending',
    documents: [],
  };
  
  // Statistics for the grants dashboard
  const _totalGrantAmount = grants.reduce((total, grant) => total + grant.amount, 0);
  const totalAwardedAmount = grants
    .filter(grant => grant.status === 'awarded')
    .reduce((total, grant) => total + grant.amount, 0);
  const totalSpent = grants.reduce((total, grant) => total + (grant.amountSpent || 0), 0);
  const pendingApplications = grants.filter(grant => grant.status === 'pending').length;
  
  useEffect(() => {
    // Save grants data whenever it changes
    onSave({ grantFunding: grants });
  }, [grants, onSave]);
  
  const handleAddGrant = () => {
    setCurrentGrant({ ...emptyGrant, id: `grant-${Date.now()}` });
    setIsAddingGrant(true);
  };
  
  const handleEditGrant = (index: number) => {
    setCurrentGrant({ ...grants[index] });
    setCurrentGrantIndex(index);
    setIsEditingGrant(true);
  };
  
  const handleDeleteGrant = (index: number) => {
    const updatedGrants = [...grants];
    updatedGrants.splice(index, 1);
    setGrants(updatedGrants);
  };
  
  const handleGrantChange = (field: string, value: any) => {
    if (currentGrant) {
      setCurrentGrant({
        ...currentGrant,
        [field]: value
      });
    }
  };
  
  const handleSaveGrant = () => {
    if (!currentGrant) return;
    
    // Validation
    if (!currentGrant.name || !currentGrant.grantNumber || !currentGrant.amount || !currentGrant.agency) {
      // Show error or handle validation
      return;
    }
    
    const updatedGrants = [...grants];
    
    if (isEditingGrant && currentGrantIndex !== null) {
      // Update existing grant
      updatedGrants[currentGrantIndex] = currentGrant;
    } else {
      // Add new grant
      updatedGrants.push(currentGrant);
    }
    
    setGrants(updatedGrants);
    closeGrantModal();
  };
  
  const closeGrantModal = () => {
    setIsAddingGrant(false);
    setIsEditingGrant(false);
    setCurrentGrant(null);
    setCurrentGrantIndex(null);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'awarded':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  const getExpenditurePercentage = (grant: GrantFunding) => {
    if (!grant.amount || !grant.amountSpent) return 0;
    return Math.min(100, Math.round((grant.amountSpent / grant.amount) * 100));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Grant Funding</CardTitle>
          <CardDescription>
            Track grant applications, awards, and reimbursements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">Total Awarded</span>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold mt-2">${totalAwardedAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600">Total Spent</span>
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold mt-2">${totalSpent.toLocaleString()}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-yellow-600">Pending Applications</span>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold mt-2">{pendingApplications}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Grants</span>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-2xl font-bold mt-2">{grants.length}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Project Grants</h3>
              <Button onClick={handleAddGrant} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Grant
              </Button>
            </div>
            
            {grants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No grants have been added yet.
              </div>
            ) : (
              <div className="space-y-4">
                {grants.map((grant, index) => (
                  <Card key={grant.id} className="overflow-hidden">
                    <div className="relative">
                      {grant.status === 'awarded' && (
                        <Progress 
                          value={getExpenditurePercentage(grant)} 
                          className="h-1 absolute top-0 left-0 right-0" 
                        />
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">
                            {grant.name}
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                              #{grant.grantNumber}
                            </span>
                          </CardTitle>
                          <CardDescription>{grant.agency}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${grant.amount.toLocaleString()}
                            {grant.status === 'awarded' && grant.amountSpent > 0 && (
                              <span className="text-sm font-normal text-muted-foreground ml-1">
                                (${grant.amountSpent.toLocaleString()} spent)
                              </span>
                            )}
                          </div>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(grant.status)}`}>
                              {grant.status.charAt(0).toUpperCase() + grant.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        {grant.program && (
                          <div>
                            <span className="block text-muted-foreground">Program</span>
                            <span>{grant.program}</span>
                          </div>
                        )}
                        {grant.applicationDate && (
                          <div>
                            <span className="block text-muted-foreground">Applied</span>
                            <span>{new Date(grant.applicationDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {grant.awardDate && (
                          <div>
                            <span className="block text-muted-foreground">Awarded</span>
                            <span>{new Date(grant.awardDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {grant.expirationDate && (
                          <div>
                            <span className="block text-muted-foreground">Expires</span>
                            <span>{new Date(grant.expirationDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {grant.matchRequirement && (
                          <div>
                            <span className="block text-muted-foreground">Match Required</span>
                            <span>{grant.matchRequirement}% (${grant.matchAmount?.toLocaleString() || 0})</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className="border-t px-6 py-3 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGrant(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGrant(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Grant Modal */}
      <Dialog 
        open={isAddingGrant || isEditingGrant} 
        onOpenChange={isOpen => {
          if (!isOpen) closeGrantModal();
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditingGrant ? 'Edit Grant' : 'Add New Grant'}
            </DialogTitle>
            <DialogDescription>
              {isEditingGrant 
                ? 'Update grant information and tracking details' 
                : 'Enter details for the new grant or funding source'}
            </DialogDescription>
          </DialogHeader>
          
          {currentGrant && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Grant Name</Label>
                    <Input
                      id="name"
                      value={currentGrant.name}
                      onChange={(e) => handleGrantChange('name', e.target.value)}
                      placeholder="e.g., Highway Safety Improvement Program"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="grantNumber">Grant Number</Label>
                    <Input
                      id="grantNumber"
                      value={currentGrant.grantNumber}
                      onChange={(e) => handleGrantChange('grantNumber', e.target.value)}
                      placeholder="e.g., HSIP-2023-001"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Grant Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={currentGrant.amount}
                      onChange={(e) => handleGrantChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amountSpent">Amount Spent ($)</Label>
                    <Input
                      id="amountSpent"
                      type="number"
                      value={currentGrant.amountSpent || 0}
                      onChange={(e) => handleGrantChange('amountSpent', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={currentGrant.status}
                      onValueChange={(value) => handleGrantChange('status', value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="awarded">Awarded</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="agency">Funding Agency</Label>
                  <Input
                    id="agency"
                    value={currentGrant.agency}
                    onChange={(e) => handleGrantChange('agency', e.target.value)}
                    placeholder="e.g., Federal Highway Administration, Caltrans"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="program">Program (Optional)</Label>
                  <Input
                    id="program"
                    value={currentGrant.program || ''}
                    onChange={(e) => handleGrantChange('program', e.target.value)}
                    placeholder="e.g., ATP Cycle 6, CMAQ"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="applicationDate">Application Date</Label>
                    <Input
                      id="applicationDate"
                      type="date"
                      value={currentGrant.applicationDate || ''}
                      onChange={(e) => handleGrantChange('applicationDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="awardDate">Award Date</Label>
                    <Input
                      id="awardDate"
                      type="date"
                      value={currentGrant.awardDate || ''}
                      onChange={(e) => handleGrantChange('awardDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={currentGrant.expirationDate || ''}
                      onChange={(e) => handleGrantChange('expirationDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matchRequirement">Match Requirement (%)</Label>
                    <Input
                      id="matchRequirement"
                      type="number"
                      value={currentGrant.matchRequirement || ''}
                      onChange={(e) => handleGrantChange('matchRequirement', parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="matchAmount">Match Amount ($)</Label>
                    <Input
                      id="matchAmount"
                      type="number"
                      value={currentGrant.matchAmount || ''}
                      onChange={(e) => handleGrantChange('matchAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="matchSource">Match Source (Optional)</Label>
                  <Input
                    id="matchSource"
                    value={currentGrant.matchSource || ''}
                    onChange={(e) => handleGrantChange('matchSource', e.target.value)}
                    placeholder="e.g., Local Funds, Measure A"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fileUpload">Upload Grant Document</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload award letters, applications, or agreements (PDF, Word, Excel)
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeGrantModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveGrant}>
              {isEditingGrant ? 'Update Grant' : 'Add Grant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrantFundingStep; 