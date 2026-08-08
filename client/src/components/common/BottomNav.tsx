import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Challans', path: '/challans', icon: FileText },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] bg-brand-dark/95 backdrop-blur border-2 border-brand-border shadow-2xl p-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-2 px-3 transition-colors group relative ${
                isActive
                  ? 'text-brand-red bg-brand-red-light font-bold border border-brand-red'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-1 group-hover:scale-105 transition-transform" />
            <span className="text-[10px] font-mono uppercase tracking-wider">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
