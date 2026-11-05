'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, TaskFormData, TaskStatus, UserProfile, BackendHealth } from '@/types';
import { supabase, signOut as supabaseSignOut } from '@/lib/supabaseClient';
import {
  checkBackendHealth,
  fetchTasks,
  fetchUsers,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '@/lib/api';

import Navbar from '@/components/Navbar';
import DashboardStats from '@/components/DashboardStats';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import AuthModal from '@/components/AuthModal';

import {
  Plus,
  Search,
  RefreshCw,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  LayoutDashboard,
  Clock,
  Loader2,
  CheckCircle,
  Users,
  Bell,
  X,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  // App state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Authentication state
  interface CurrentUser {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      avatar_url?: string;
      picture?: string;
    };
  }
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Notification Toast state
  const [toast, setToast] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (type: 'success' | 'warning' | 'error', message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 6000);
    },
    []
  );

  // 1. Check Backend Health
  const loadHealth = useCallback(async () => {
    setCheckingHealth(true);
    const health = await checkBackendHealth();
    setBackendHealth(health);
    setCheckingHealth(false);
  }, []);

  // 2. Fetch Tasks & Users from Flask Backend
  const loadData = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const [fetchedTasks, fetchedUsers] = await Promise.all([
        fetchTasks(),
        fetchUsers(),
      ]);
      setTasks(fetchedTasks);
      setUsers(fetchedUsers);
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast('error', err.message);
      } else {
        showToast('error', 'Failed to load task data');
      }
    } finally {
      setLoadingTasks(false);
    }
  }, [showToast]);

  // Initial load & Supabase Auth listener
  useEffect(() => {
    loadHealth();
    loadData();

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
          showToast(
            'success',
            `Welcome, ${session.user.user_metadata?.full_name || session.user.email}!`
          );
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loadHealth, loadData, showToast]);

  // Guest login handler
  const handleGuestLogin = (name: string, email: string) => {
    const demoUser = {
      id: `demo-${Date.now()}`,
      email,
      user_metadata: {
        full_name: name,
      },
    };
    setUser(demoUser);
    showToast('success', `Signed in as ${name}`);
  };

  const handleLogout = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
      showToast('success', 'You have been signed out');
    } catch {
      setUser(null);
    }
  };

  // Task creation/editing submission
  const handleTaskSubmit = async (formData: TaskFormData) => {
    if (taskToEdit) {
      const updated = await updateTask(taskToEdit.id, formData);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast('success', `Task "${updated.title}" updated`);
    } else {
      const result = await createTask(formData);
      setTasks((prev) => [result.task, ...prev]);

      if (result.notification) {
        if (result.notification.success) {
          showToast('success', `Task created & Gmail notification dispatched!`);
        } else if (result.notification.error) {
          showToast(
            'warning',
            `Task saved. (Email notice: ${result.notification.error})`
          );
        }
      } else {
        showToast('success', `Task "${result.task.title}" created successfully`);
      }
    }
  };

  // Quick status toggle
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const result = await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      if (newStatus === 'completed') {
        if (result.notification?.success) {
          showToast('success', 'Task completed! Notification email delivered.');
        } else {
          showToast('success', 'Task marked as completed');
        }
      } else {
        showToast('success', `Status updated to ${newStatus.replace('_', ' ')}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast('error', err.message);
      }
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('success', 'Task deleted successfully');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast('error', err.message);
      }
    }
  };

  // Filtered & Searched tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeFilter !== 'all' && task.status !== activeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(q);
        const descMatch = (task.description || '').toLowerCase().includes(q);
        const assigneeMatch = (task.assignee_name || '').toLowerCase().includes(q);
        return titleMatch || descMatch || assigneeMatch;
      }
      return true;
    });
  }, [tasks, activeFilter, searchQuery]);

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const navItems = [
    { id: 'all', label: 'All Tasks', icon: LayoutDashboard, count: counts.all },
    { id: 'pending', label: 'Pending', icon: Clock, count: counts.pending },
    { id: 'in_progress', label: 'In Progress', icon: Loader2, count: counts.in_progress },
    { id: 'completed', label: 'Completed', icon: CheckCircle, count: counts.completed },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        backendHealth={backendHealth}
        checkingHealth={checkingHealth}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ==================================================================== */}
          {/* SIDEBAR NAVIGATION (Desktop & Mobile Drawer) */}
          {/* ==================================================================== */}
          <aside
            className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white p-6 shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-full lg:transform-none lg:shadow-none lg:bg-transparent lg:p-0 lg:col-span-3 ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Mobile Drawer Close button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 lg:hidden">
              <span className="font-bold text-slate-800">Menu</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <button
                  onClick={() => {
                    setTaskToEdit(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>Create New Task</span>
                </button>
              </div>

              {/* Navigation Filter Links */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Task Views
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveFilter(item.id);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Team Members Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-800">Team Members</span>
                  </div>
                  <span className="text-[10px] font-bold rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    {users.length}
                  </span>
                </div>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {users.length > 0 ? (
                    users.map((u) => (
                      <div key={u.id} className="flex items-center gap-2.5 py-1 text-xs">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.full_name || u.email}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                            {(u.full_name || u.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-slate-700 truncate max-w-[150px]">
                          {u.full_name || u.email}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      Sign in with Google to appear in the registered team list.
                    </p>
                  )}
                </div>
              </div>

              {/* System Info Banner */}
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span>Email Dispatch</span>
                </div>
                <p className="mt-1 text-[11px] text-blue-800/80 leading-relaxed">
                  {backendHealth?.email_notifications?.configured
                    ? 'Gmail automated notifications are active for task events.'
                    : 'Configure GMAIL_USER & GMAIL_APP_PASSWORD in backend/.env to send real emails.'}
                </p>
              </div>
            </div>
          </aside>

          {/* Backdrop for mobile sidebar */}
          {mobileSidebarOpen && (
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
            />
          )}

          {/* ==================================================================== */}
          {/* MAIN DASHBOARD CONTENT */}
          {/* ==================================================================== */}
          <main className="lg:col-span-9 space-y-6">
            {/* Toast Notification Alert */}
            {toast && (
              <div
                className={`flex items-center justify-between rounded-2xl p-4 shadow-sm border transition-all ${
                  toast.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : toast.type === 'warning'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-red-50 text-red-900 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {toast.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm font-semibold">{toast.message}</span>
                </div>
                <button
                  onClick={() => setToast(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Top Workspace Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Team Task Dashboard
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                  Monitor progress, assign work to teammates, and dispatch Gmail updates in real-time.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadData}
                  disabled={loadingTasks}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900"
                  title="Refresh task list"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingTasks ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Dynamic Metric Cards */}
            <DashboardStats
              tasks={tasks}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              {/* Search input */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks, descriptions, or assignees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Status Tabs on mobile/tablet */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setActiveFilter(status)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition cursor-pointer ${
                      activeFilter === status
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Grid */}
            {loadingTasks ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    users={users}
                    onStatusChange={handleStatusChange}
                    onEdit={(t) => {
                      setTaskToEdit(t);
                      setIsTaskModalOpen(true);
                    }}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
                  <Inbox className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  No tasks found
                </h3>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  {searchQuery || activeFilter !== 'all'
                    ? 'No tasks match your current filter criteria. Try clearing search or selecting All Tasks.'
                    : 'Get started by creating your first task to manage workflow and assignments.'}
                </p>
                <button
                  onClick={() => {
                    setTaskToEdit(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Task</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        taskToEdit={taskToEdit}
        users={users}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onGuestLogin={handleGuestLogin}
      />
    </div>
  );
}
