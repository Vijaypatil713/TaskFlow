export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  created_by?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  created_at: string;
  completed_at?: string | null;
  // Augmented UI fields
  creator_name?: string;
  creator_email?: string;
  assignee_name?: string;
  assignee_email?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  assigned_to?: string;
  assigned_to_email?: string;
  assignee_name?: string;
  due_date?: string;
}

export interface BackendHealth {
  status: string;
  database: {
    connected: boolean;
    status: string;
    error?: string;
  };
  email_notifications: {
    configured: boolean;
    provider: string;
  };
}

