import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export default function Header({ title, subtitle, actionButton }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-brand-dark border-b border-brand-border py-4 px-6 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl md:text-2xl text-white tracking-wide uppercase">{title}</h1>
          {user && (
            <span className="bg-brand-red text-white text-[10px] font-mono px-2 py-0.5 font-bold uppercase tracking-widest">
              {user.role}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-wider">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actionButton}

        {user && (
          <button
            onClick={handleLogout}
            title="Sign out of system"
            className="bg-brand-black hover:bg-zinc-900 border border-brand-border text-zinc-400 hover:text-brand-red p-2.5 transition-colors flex items-center gap-2 font-mono text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline uppercase">Exit</span>
          </button>
        )}
      </div>
    </header>
  );
}
