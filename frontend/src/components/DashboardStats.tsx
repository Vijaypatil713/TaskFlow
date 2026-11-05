'use client';

import React from 'react';
import { Task } from '@/types';
import { ListTodo, Clock, Loader2, CheckCircle2, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  tasks: Task[];
  activeFilter: string;
  onFilterChange: (status: string) => void;
}

export default function DashboardStats({
  tasks,
  activeFilter,
  onFilterChange,
}: DashboardStatsProps) {
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;

  const cards = [
    {
      id: 'all',
      label: 'Total Tasks',
      count: total,
      icon: ListTodo,
      textColor: 'text-blue-700',
      iconBg: 'bg-blue-100 text-blue-700',
      borderColor: 'border-slate-200/90 hover:border-blue-400',
      activeRing: 'ring-2 ring-blue-600 bg-blue-50/40',
      subtext: 'All workspace tasks',
    },
    {
      id: 'pending',
      label: 'Pending',
      count: pending,
      icon: Clock,
      textColor: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-700',
      borderColor: 'border-slate-200/90 hover:border-amber-400',
      activeRing: 'ring-2 ring-amber-500 bg-amber-50/40',
      subtext: 'Awaiting action',
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      count: inProgress,
      icon: Loader2,
      textColor: 'text-indigo-700',
      iconBg: 'bg-indigo-100 text-indigo-700',
      borderColor: 'border-slate-200/90 hover:border-indigo-400',
      activeRing: 'ring-2 ring-indigo-500 bg-indigo-50/40',
      subtext: 'Under active work',
    },
    {
      id: 'completed',
      label: 'Completed',
      count: completed,
      icon: CheckCircle2,
      textColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
      borderColor: 'border-slate-200/90 hover:border-emerald-400',
      activeRing: 'ring-2 ring-emerald-500 bg-emerald-50/40',
      subtext: 'Successfully resolved',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;
        const percentage = total > 0 ? Math.round((card.count / total) * 100) : 0;

        return (
          <button
            key={card.id}
            onClick={() => onFilterChange(card.id)}
            className={`group relative flex flex-col justify-between p-5 rounded-2xl border bg-white text-left transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
              card.borderColor
            } ${isActive ? card.activeRing : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
              <div className={`p-2.5 rounded-xl transition group-hover:scale-105 ${card.iconBg}`}>
                <Icon className="h-5 w-5 stroke-[2.2]" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black tracking-tight text-slate-900">
                {card.count}
              </span>

              {card.id !== 'all' && total > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  <TrendingUp className="h-3 w-3" />
                  {percentage}%
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              <span>{card.subtext}</span>
              <span className="font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition">
                Filter &rarr;
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
