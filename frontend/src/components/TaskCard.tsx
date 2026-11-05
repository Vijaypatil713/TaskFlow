'use client';

import React from 'react';
import { Task, TaskStatus, UserProfile } from '@/types';
import {
  Calendar,
  CheckCircle2,
  Trash2,
  Edit3,
  Clock,
  User as UserIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  users: UserProfile[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({
  task,
  users,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';

  // Find assignee info
  const assignee = users.find((u) => u.id === task.assigned_to);
  const assigneeDisplay =
    assignee?.full_name ||
    assignee?.email ||
    task.assignee_name ||
    (task.assigned_to ? 'Assigned' : 'Unassigned');

  // Format due date
  const isOverdue =
    task.due_date &&
    !isCompleted &&
    new Date(task.due_date).getTime() < Date.now();

  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 shadow-sm hover:shadow-md bg-white ${
        isCompleted
          ? 'border-emerald-200/90 bg-emerald-50/20'
          : isInProgress
          ? 'border-indigo-200/80 bg-white'
          : 'border-slate-200/80 bg-white'
      }`}
    >
      <div>
        {/* Header row: Status badge + Quick Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Status Select Badge */}
          <div className="relative">
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider cursor-pointer border transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : isInProgress
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <option value="pending">● Pending</option>
              <option value="in_progress">● In Progress</option>
              <option value="completed">✔ Completed</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {!isCompleted && (
              <button
                onClick={() => onStatusChange(task.id, 'completed')}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                title="Mark task as completed"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Done</span>
              </button>
            )}

            <button
              onClick={() => onEdit(task)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Edit task"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDelete(task.id)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Task Title */}
        <h4
          className={`mt-3.5 text-base font-bold tracking-tight text-slate-900 ${
            isCompleted ? 'line-through text-slate-400' : ''
          }`}
        >
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 line-clamp-3 font-normal">
            {task.description}
          </p>
        )}
      </div>

      {/* Footer Meta: Assignee, Due Date */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
        {/* Assignee */}
        <div className="flex items-center gap-2 text-slate-600">
          {assignee?.avatar_url ? (
            <img
              src={assignee.avatar_url}
              alt={assigneeDisplay}
              className="h-6 w-6 rounded-full object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
              {assigneeDisplay.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-slate-700 truncate max-w-[130px]" title={assigneeDisplay}>
            {assigneeDisplay}
          </span>
        </div>

        {/* Due date */}
        {formattedDueDate && (
          <div
            className={`flex items-center gap-1 font-semibold ${
              isOverdue
                ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200'
                : 'text-slate-500'
            }`}
            title={isOverdue ? 'Task is overdue!' : 'Due date'}
          >
            {isOverdue ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <Calendar className="h-3.5 w-3.5" />
            )}
            <span>{formattedDueDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
