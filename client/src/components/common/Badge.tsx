import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'danger' | 'warning' | 'subtle' | 'white';
  children: React.ReactNode;
}

export default function Badge({ variant = 'default', children }: BadgeProps) {
  const variantStyles = {
    default: 'bg-zinc-800 text-zinc-200 border-zinc-700',
    danger: 'bg-brand-red text-white border-brand-red font-bold',
    warning: 'bg-yellow-950/80 text-yellow-400 border-yellow-800',
    subtle: 'bg-brand-black text-zinc-400 border-brand-border',
    white: 'bg-white text-black border-white font-bold',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider border ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
