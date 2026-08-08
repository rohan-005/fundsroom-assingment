import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loader({ label = 'LOADING SYSTEM DATA...' }: { label?: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}
