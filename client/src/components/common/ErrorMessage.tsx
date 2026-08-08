import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message = 'An unexpected error occurred while processing data.', onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-950/60 border border-brand-red p-6 text-red-200 font-mono text-xs my-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-brand-red uppercase block mb-1">SYSTEM_FAULT_DETECTED</span>
          <span>{message}</span>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2 uppercase font-bold flex items-center gap-2 border border-brand-red shrink-0 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RETRY</span>
        </button>
      )}
    </div>
  );
}
