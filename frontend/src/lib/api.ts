import { Task, TaskFormData, TaskStatus, UserProfile, BackendHealth } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Builds standard headers including Authorization if user is logged in
 */
function getHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function checkBackendHealth(): Promise<BackendHealth | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchUsers(): Promise<UserProfile[]> {
  try {
    const res = await fetch(`${API_BASE}/users`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  } catch {
    return [];
  }
}

export async function fetchTasks(filters?: {
  status?: string;
  assigned_to?: string;
  created_by?: string;
}): Promise<Task[]> {
  const url = new URL(`${API_BASE}/tasks`);
  if (filters?.status && filters.status !== 'all') {
    url.searchParams.set('status', filters.status);
  }
  if (filters?.assigned_to) {
    url.searchParams.set('assigned_to', filters.assigned_to);
  }
  if (filters?.created_by) {
    url.searchParams.set('created_by', filters.created_by);
  }

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to fetch tasks (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.tasks || [];
}

export async function createTask(
  formData: TaskFormData,
  token?: string | null
): Promise<{ task: Task; notification?: { success: boolean; error?: string; message?: string } }> {
  const res = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(formData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Failed to create task (HTTP ${res.status})`);
  }
  return data;
}

export async function updateTask(
  taskId: string,
  formData: Partial<TaskFormData>,
  token?: string | null
): Promise<Task> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(formData),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Failed to update task (HTTP ${res.status})`);
  }
  return data.task;
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  token?: string | null
): Promise<{ task: Task; notification?: { success: boolean; error?: string; message?: string } }> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: getHeaders(token),
    body: JSON.stringify({ status }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Failed to update status (HTTP ${res.status})`);
  }
  return data;
}

export async function deleteTask(taskId: string, token?: string | null): Promise<boolean> {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Failed to delete task (HTTP ${res.status})`);
  }
  return true;
}

