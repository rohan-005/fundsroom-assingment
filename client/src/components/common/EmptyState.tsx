import React from 'react';
import { Database } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = 'NO RECORDS FOUND',
  description = 'There are no active entries matching the specified criteria.',
  action,
}: EmptyStateProps) {
  return (
    <div className="border border-dashed border-brand-border bg-brand-dark/40 py-16 px-6 text-center flex flex-col items-center justify-center my-4">
      <div className="p-4 bg-brand-black border border-brand-border mb-4 text-zinc-500">
        <Database className="w-8 h-8" />
      </div>
      <h3 className="font-heading text-sm text-zinc-300 uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-xs font-mono text-zinc-500 max-w-sm mb-6 uppercase">{description}</p>
      {action}
    </div>
  );
}
