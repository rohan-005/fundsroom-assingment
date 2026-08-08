import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full ${maxWidth} bg-brand-dark border-2 border-brand-border shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Red Bar */}
        <div className="h-1 bg-brand-red w-full"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-brand-border bg-brand-black">
          <h2 className="font-heading text-lg text-white uppercase tracking-wider">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors border border-brand-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto font-sans flex-1 text-sm">{children}</div>
      </div>
    </div>
  );
}
