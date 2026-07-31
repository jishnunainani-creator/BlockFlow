import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface ContextHelpProps {
  text: string;
  title?: string;
  size?: number;
  className?: string;
}

export const ContextHelp: React.FC<ContextHelpProps> = ({ text, title, size = 14, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="text-slate-500 hover:text-indigo-400 p-0.5 rounded-full transition-colors focus:outline-none"
        aria-label="Contextual Help"
      >
        <HelpCircle size={size} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 sm:w-64 bg-slate-900 text-slate-200 text-[11px] leading-normal p-3 rounded-xl border border-indigo-500/30 shadow-xl z-50 animate-fade-in pointer-events-none">
          {title && <div className="font-bold text-white mb-1 text-xs">{title}</div>}
          <div>{text}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};
