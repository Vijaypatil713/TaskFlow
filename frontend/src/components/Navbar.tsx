'use client';

import React from 'react';
import { BackendHealth } from '@/types';
import {
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  Shield,
  Activity,
} from 'lucide-react';

interface NavbarProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
      avatar_url?: string;
      picture?: string;
    };
  } | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  backendHealth: BackendHealth | null;
  checkingHealth: boolean;
  onToggleSidebar?: () => void;
}

export default function Navbar({
  user,
  onLoginClick,
  onLogoutClick,
  backendHealth,
  checkingHealth,
  onToggleSidebar,
}: NavbarProps) {
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Guest User';

  const avatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
              aria-label="Toggle Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <CheckCircle2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Task<span className="text-blue-600">Flow</span>
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-200/60 hidden sm:inline-block">
                  Workspace
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: System Status & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* API Health Pill */}
          <div className="flex items-center">
            {checkingHealth ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                <span className="h-2 w-2 animate-ping rounded-full bg-slate-400" />
                Connecting API...
              </span>
            ) : backendHealth?.status === 'healthy' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/70 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                API Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Start Flask API</span>
                <span className="sm:hidden">API Offline</span>
              </span>
            )}
          </div>

          {/* User Profile or Sign-in */}
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1.5 pr-3 shadow-2xs">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-8 w-8 rounded-lg object-cover ring-2 ring-blue-500/20"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight text-slate-800 truncate max-w-[140px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                onClick={onLogoutClick}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
