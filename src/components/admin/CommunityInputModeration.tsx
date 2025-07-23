'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { 
  Check, 
  X, 
  Eye, 
  Clock, 
  MessageSquare,
  MapPin,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface CommunityInput {
  id: string;
  type: 'point' | 'line' | 'polygon';
  geometry: any;
  title: string;
  description: string;
  category_key: string;
  category?: {
    name: string;
    color: string;
  };
  username: string;
  user_email?: string;
  status: 'pending' | 'approved' | 'rejected';
  llm_category?: string;
  llm_confidence?: number;
  moderation_note?: string;
  agency_response?: string;
  upvotes: number;
  downvotes: number;
  images?: Array<{
    id: string;
    url: string;
    thumbnail_url?: string;
  }>;
  created_at: string;
}

interface CommunityInputModerationProps {
  organizationId: string;
}

export default function CommunityInputModeration({ organizationId }: CommunityInputModerationProps) {
  const { toast } = useToast();
  const supabase = createClient();
  
  const [inputs, setInputs] = useState<CommunityInput[]>([]);
  const [selectedInput, setSelectedInput] = useState<CommunityInput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [moderationNote, setModerationNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  
  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Load community inputs
  useEffect(() => {
    loadInputs();
  }, [organizationId, activeTab]);

  const loadInputs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        organizationId,
        status: activeTab === 'all' ? '' : activeTab
      });
      
      const response = await fetch(`/api/community-inputs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setInputs(data.data || []);
        
        // Update statistics
        if (activeTab === 'all') {
          const pending = data.data.filter((i: CommunityInput) => i.status === 'pending').length;
          const approved = data.data.filter((i: CommunityInput) => i.status === 'approved').length;
          const rejected = data.data.filter((i: CommunityInput) => i.status === 'rejected').length;
          
          setStats({
            pending,
            approved,
            rejected,
            total: data.data.length
          });
        }
      }
    } catch (error) {
      // Error loading inputs
      toast({
        title: 'Error',
        description: 'Failed to load community inputs',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeration = async (input: CommunityInput, newStatus: 'approved' | 'rejected') => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/community-inputs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: input.id,
          status: newStatus,
          moderationNote
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: `Input ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`
        });
        
        // Update local state
        setInputs(prev => prev.filter(i => i.id !== input.id));
        setSelectedInput(null);
        setModerationNote('');
        
        // Update stats
        setStats(prev => ({
          ...prev,
          pending: prev.pending - 1,
          [newStatus]: prev[newStatus] + 1
        }));
      }
    } catch (error) {
      // Error moderating input
      toast({
        title: 'Error',
        description: 'Failed to update input status',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject', inputIds: string[]) => {
    setIsProcessing(true);
    try {
      const promises = inputIds.map(id => 
        fetch('/api/community-inputs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            status: action === 'approve' ? 'approved' : 'rejected',
            moderationNote: `Bulk ${action}`
          })
        })
      );
      
      await Promise.all(promises);
      
      toast({
        title: 'Success',
        description: `${inputIds.length} inputs ${action}d successfully`
      });
      
      loadInputs();
    } catch (error) {
      // Error in bulk action
      toast({
        title: 'Error',
        description: 'Some inputs failed to update',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inputs</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Community Input Moderation</CardTitle>
          <CardDescription>
            Review and moderate community feedback submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading inputs...</p>
                </div>
              ) : inputs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No {activeTab === 'all' ? '' : activeTab} inputs found
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Input List */}
                  <div>
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-3">
                        {inputs.map(input => (
                          <Card
                            key={input.id}
                            className={`cursor-pointer transition-colors hover:bg-accent ${
                              selectedInput?.id === input.id ? 'ring-2 ring-primary' : ''
                            }`}
                            onClick={() => setSelectedInput(input)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium">{input.title}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {input.description}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Badge 
                                      variant="outline"
                                      style={{ 
                                        borderColor: input.category?.color,
                                        color: input.category?.color 
                                      }}
                                    >
                                      {input.category?.name || input.category_key}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {input.username}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(input.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  {input.llm_category && (
                                    <div className="mt-2">
                                      <Badge variant="secondary" className="text-xs">
                                        AI: {input.llm_category} ({Math.round((input.llm_confidence || 0) * 100)}%)
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-center gap-1 ml-3">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs capitalize">{input.type}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Detail View */}
                  <div>
                    {selectedInput ? (
                      <Card className="h-[600px] flex flex-col">
                        <CardHeader>
                          <CardTitle>Input Details</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-lg">{selectedInput.title}</h4>
                              <p className="text-muted-foreground mt-2">
                                {selectedInput.description}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">User:</span>
                                <p className="font-medium">{selectedInput.username}</p>
                                {selectedInput.user_email && (
                                  <p className="text-xs text-muted-foreground">{selectedInput.user_email}</p>
                                )}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Submitted:</span>
                                <p className="font-medium">
                                  {new Date(selectedInput.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Category:</span>
                                <p className="font-medium">{selectedInput.category?.name || selectedInput.category_key}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Type:</span>
                                <p className="font-medium capitalize">{selectedInput.type}</p>
                              </div>
                            </div>
                            
                            {selectedInput.images && selectedInput.images.length > 0 && (
                              <div>
                                <span className="text-sm text-muted-foreground">Attached Images:</span>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  {selectedInput.images.map((img, idx) => (
                                    <img
                                      key={img.id || idx}
                                      src={img.thumbnail_url || img.url}
                                      alt={`Attachment ${idx + 1}`}
                                      className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80"
                                      onClick={() => window.open(img.url, '_blank')}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <ThumbsUp className="h-4 w-4" />
                                <span className="text-sm">{selectedInput.upvotes}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ThumbsDown className="h-4 w-4" />
                                <span className="text-sm">{selectedInput.downvotes}</span>
                              </div>
                            </div>
                            
                            {selectedInput.moderation_note && (
                              <div className="p-3 bg-muted rounded">
                                <p className="text-sm font-medium">Previous Moderation Note:</p>
                                <p className="text-sm mt-1">{selectedInput.moderation_note}</p>
                              </div>
                            )}
                            
                            {selectedInput.status === 'pending' && (
                              <div className="space-y-3 pt-4 border-t">
                                <div>
                                  <Label htmlFor="moderation-note">Moderation Note (optional)</Label>
                                  <Textarea
                                    id="moderation-note"
                                    value={moderationNote}
                                    onChange={(e) => setModerationNote(e.target.value)}
                                    placeholder="Add a note about this decision..."
                                    rows={3}
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1"
                                    onClick={() => handleModeration(selectedInput, 'approved')}
                                    disabled={isProcessing}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleModeration(selectedInput, 'rejected')}
                                    disabled={isProcessing}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="h-[600px] flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Eye className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p>Select an input to view details</p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              )}
              
              {/* Bulk Actions for Pending */}
              {activeTab === 'pending' && inputs.length > 0 && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('approve', inputs.map(i => i.id))}
                    disabled={isProcessing}
                  >
                    Approve All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('reject', inputs.map(i => i.id))}
                    disabled={isProcessing}
                  >
                    Reject All
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 