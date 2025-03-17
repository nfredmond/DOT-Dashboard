import { getClient } from '@/lib/supabase-service';

export type RequestStatus = 
  | 'submitted' 
  | 'initial_review' 
  | 'gathering_records' 
  | 'legal_review' 
  | 'records_ready' 
  | 'completed' 
  | 'denied' 
  | 'withdrawn' 
  | 'overdue';

export type RequestType = 
  | 'general' 
  | 'project' 
  | 'financial' 
  | 'environmental' 
  | 'other';

export type DocumentStatus = 
  | 'pending_review' 
  | 'collecting' 
  | 'ready' 
  | 'released';

export type RecordFormat = 
  | 'electronic' 
  | 'paper';

export interface PublicRecordsRequest {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  request_type: RequestType;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  completed_date: string | null;
  requester_id: string | null;
  agency_id: string;
  assigned_to: string | null;
  project_id: string | null;
  from_date: string | null;
  to_date: string | null;
  format_preference: RecordFormat;
  estimated_completion_date: string | null;
  special_instructions: string | null;
  legal_exemptions: string[] | null;
  fee_estimate: number | null;
  fee_paid: boolean;
  fee_waived: boolean;
  internal_notes: string | null;
  is_expedited: boolean;
  needs_clarification: boolean;
  extension_requested: boolean;
  extension_reason: string | null;
  extension_date: string | null;
}

export interface Requester {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization?: string;
  created_at: string;
}

export interface RecordDocument {
  id: string;
  request_id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  status: DocumentStatus;
  reviewed_by?: string;
  uploaded_at: string;
  released_at?: string;
  redacted: boolean;
  page_count?: number;
}

export interface RequestTimeline {
  id: string;
  request_id: string;
  status: RequestStatus;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface RequestMessage {
  id: string;
  request_id: string;
  sender_id: string;
  sender_type: 'staff' | 'requester';
  content: string;
  created_at: string;
  read: boolean;
}

export interface AnalyticsData {
  total_requests: number;
  open_requests: number;
  overdue_requests: number;
  avg_time_to_complete: number;
  request_volume_by_month: { month: string; count: number }[];
  request_types: { type: RequestType; count: number }[];
  department_workload: { department: string; count: number }[];
}

class PublicRecordsService {
  private get supabase() {
    return getClient();
  }

  // Submit a new public records request
  async submitRequest(request: Omit<PublicRecordsRequest, 'id' | 'created_at' | 'updated_at' | 'status'>, requester: Omit<Requester, 'id' | 'created_at'>): Promise<{ success: boolean; request_id?: string; error?: string }> {
    try {
      // First, create or update the requester
      const { data: requesterData, error: requesterError } = await this.supabase
        .from('prr_requesters')
        .upsert({
          first_name: requester.first_name,
          last_name: requester.last_name,
          email: requester.email,
          phone: requester.phone,
          organization: requester.organization
        }, { onConflict: 'email' })
        .select('id')
        .single();

      if (requesterError) throw new Error(requesterError.message);

      // Then, create the request
      const { data: requestData, error: requestError } = await this.supabase
        .from('prr_requests')
        .insert({
          title: request.title,
          description: request.description,
          status: 'submitted', // Initial status
          request_type: request.request_type,
          requester_id: requesterData.id,
          agency_id: request.agency_id,
          project_id: request.project_id,
          from_date: request.from_date,
          to_date: request.to_date,
          format_preference: request.format_preference,
          special_instructions: request.special_instructions,
          // Calculate due date (typically 10 business days, but this is simplified)
          due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select('id')
        .single();

      if (requestError) throw new Error(requestError.message);

      // Create initial timeline entry
      await this.supabase
        .from('prr_request_timeline')
        .insert({
          request_id: requestData.id,
          status: 'submitted',
          notes: 'Request received'
        });

      return { success: true, request_id: requestData.id };
    } catch (error) {
      console.error('Error submitting request:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get a public records request by ID
  async getRequest(requestId: string): Promise<{ request?: PublicRecordsRequest; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('prr_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Request not found');

      return { request: data as unknown as PublicRecordsRequest };
    } catch (error) {
      console.error('Error fetching request:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Find a request by ID and requester email
  async findRequestByIdAndEmail(requestId: string, email: string): Promise<{ request?: PublicRecordsRequest; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('prr_requests')
        .select('prr_requests.*, prr_requesters.email')
        .eq('prr_requests.id', requestId)
        .eq('prr_requesters.email', email)
        .join('prr_requesters', 'prr_requests.requester_id', 'prr_requesters.id')
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Request not found');

      return { request: data as unknown as PublicRecordsRequest };
    } catch (error) {
      console.error('Error finding request:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get all documents for a request
  async getRequestDocuments(requestId: string): Promise<{ documents?: RecordDocument[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('prr_documents')
        .select('*')
        .eq('request_id', requestId)
        .order('uploaded_at', { ascending: false });

      if (error) throw new Error(error.message);

      return { documents: data as unknown as RecordDocument[] };
    } catch (error) {
      console.error('Error fetching documents:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get timeline for a request
  async getRequestTimeline(requestId: string): Promise<{ timeline?: RequestTimeline[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('prr_request_timeline')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);

      return { timeline: data as unknown as RequestTimeline[] };
    } catch (error) {
      console.error('Error fetching timeline:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get messages for a request
  async getRequestMessages(requestId: string): Promise<{ messages?: RequestMessage[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('prr_messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);

      return { messages: data as unknown as RequestMessage[] };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Send a message
  async sendMessage(requestId: string, senderId: string, senderType: 'staff' | 'requester', content: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('prr_messages')
        .insert({
          request_id: requestId,
          sender_id: senderId,
          sender_type: senderType,
          content: content
        });

      if (error) throw new Error(error.message);

      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Admin: Get all requests
  async getAllRequests(params: {
    status?: RequestStatus | 'active' | 'closed';
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ requests?: PublicRecordsRequest[]; total?: number; error?: string }> {
    try {
      const { 
        status, 
        page = 1, 
        limit = 10, 
        search = '', 
        sortBy = 'created_at', 
        sortDirection = 'desc' 
      } = params;
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Start query
      let query = this.supabase
        .from('prr_requests')
        .select('*, prr_requesters!inner(*)', { count: 'exact' });
      
      // Add filters
      if (status === 'active') {
        query = query.not('status', 'in', ['completed', 'denied', 'withdrawn']);
      } else if (status === 'closed') {
        query = query.in('status', ['completed', 'denied', 'withdrawn']);
      } else if (status) {
        query = query.eq('status', status);
      }
      
      // Add search
      if (search) {
        query = query.or(`title.ilike.%${search}%, description.ilike.%${search}%, prr_requesters.first_name.ilike.%${search}%, prr_requesters.last_name.ilike.%${search}%`);
      }
      
      // Add pagination and sorting
      const { data, error, count } = await query
        .order(sortBy, { ascending: sortDirection === 'asc' })
        .range(offset, offset + limit - 1);
      
      if (error) throw new Error(error.message);
      
      return { 
        requests: data as unknown as PublicRecordsRequest[], 
        total: count 
      };
    } catch (error) {
      console.error('Error fetching requests:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Admin: Update request status
  async updateRequestStatus(requestId: string, status: RequestStatus, notes?: string, updatedBy?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update the request
      const { error: updateError } = await this.supabase
        .from('prr_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw new Error(updateError.message);

      // Add to timeline
      const { error: timelineError } = await this.supabase
        .from('prr_request_timeline')
        .insert({
          request_id: requestId,
          status,
          notes,
          created_by: updatedBy || 'system'
        });

      if (timelineError) throw new Error(timelineError.message);

      return { success: true };
    } catch (error) {
      console.error('Error updating status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Admin: Assign request to staff
  async assignRequest(requestId: string, staffId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('prr_requests')
        .update({ 
          assigned_to: staffId,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw new Error(error.message);

      return { success: true };
    } catch (error) {
      console.error('Error assigning request:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Admin: Upload a document for a request
  async uploadDocument(requestId: string, file: File, details: {
    name: string;
    description?: string;
    status: DocumentStatus;
    redacted?: boolean;
    uploadedBy: string;
  }): Promise<{ success: boolean; document_id?: string; error?: string }> {
    try {
      // Get file extension and generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${requestId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to storage
      const { data: storageData, error: storageError } = await this.supabase
        .storage
        .from('public_records_documents')
        .upload(fileName, file);
      
      if (storageError) throw new Error(storageError.message);
      
      // Get the public URL
      const { data: urlData } = await this.supabase
        .storage
        .from('public_records_documents')
        .getPublicUrl(fileName);
      
      // Create document record
      const { data: documentData, error: documentError } = await this.supabase
        .from('prr_documents')
        .insert({
          request_id: requestId,
          name: details.name,
          description: details.description,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          status: details.status,
          reviewed_by: details.uploadedBy,
          redacted: details.redacted || false,
          // Estimate page count for PDFs (very rough)
          page_count: file.type === 'application/pdf' ? Math.floor(file.size / 30000) : undefined
        })
        .select('id')
        .single();
      
      if (documentError) throw new Error(documentError.message);
      
      return { success: true, document_id: documentData.id };
    } catch (error) {
      console.error('Error uploading document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Admin: Update document status
  async updateDocumentStatus(documentId: string, status: DocumentStatus, reviewedBy?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { status };
      
      // If document is being released, add released_at date
      if (status === 'released') {
        updateData.released_at = new Date().toISOString();
      }
      
      // If reviewer is specified, add it
      if (reviewedBy) {
        updateData.reviewed_by = reviewedBy;
      }
      
      const { error } = await this.supabase
        .from('prr_documents')
        .update(updateData)
        .eq('id', documentId);
      
      if (error) throw new Error(error.message);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating document status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Admin: Get analytics data
  async getAnalytics(agencyId: string, timeframe: 'month' | 'quarter' | 'year' = 'month'): Promise<{ data?: AnalyticsData; error?: string }> {
    try {
      // Get current date and calculate start date based on timeframe
      const now = new Date();
      let startDate = new Date();
      
      if (timeframe === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (timeframe === 'quarter') {
        startDate.setMonth(startDate.getMonth() - 3);
      } else if (timeframe === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }
      
      const startDateStr = startDate.toISOString();
      
      // Get counts of total, open, and overdue requests
      const { data: countData, error: countError } = await this.supabase
        .rpc('get_prr_request_counts', { agency_id_param: agencyId });
      
      if (countError) throw new Error(countError.message);
      
      // Get average completion time
      const { data: avgTimeData, error: avgTimeError } = await this.supabase
        .rpc('get_prr_avg_completion_time', { agency_id_param: agencyId });
      
      if (avgTimeError) throw new Error(avgTimeError.message);
      
      // Get monthly request volume
      const { data: volumeData, error: volumeError } = await this.supabase
        .rpc('get_prr_request_volume_by_month', { 
          agency_id_param: agencyId,
          start_date_param: startDateStr
        });
      
      if (volumeError) throw new Error(volumeError.message);
      
      // Get request types distribution
      const { data: typeData, error: typeError } = await this.supabase
        .rpc('get_prr_request_types', { 
          agency_id_param: agencyId,
          start_date_param: startDateStr
        });
      
      if (typeError) throw new Error(typeError.message);
      
      // Get department workload
      const { data: deptData, error: deptError } = await this.supabase
        .rpc('get_prr_department_workload', { 
          agency_id_param: agencyId,
          start_date_param: startDateStr
        });
      
      if (deptError) throw new Error(deptError.message);
      
      return {
        data: {
          total_requests: countData.total_count,
          open_requests: countData.open_count,
          overdue_requests: countData.overdue_count,
          avg_time_to_complete: avgTimeData.avg_days,
          request_volume_by_month: volumeData as { month: string; count: number }[],
          request_types: typeData as { type: RequestType; count: number }[],
          department_workload: deptData as { department: string; count: number }[]
        }
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const publicRecordsService = new PublicRecordsService(); 