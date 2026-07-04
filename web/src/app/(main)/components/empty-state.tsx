"use client";

import { Ticket } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message: string;
  onClear?: () => void;
}

export default function EmptyState({
  title,
  message,
  onClear,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
        <Ticket className="w-6 h-6 text-white/15" />
      </div>

      {title && (
        <h3 className="text-white font-bold text-lg mb-1 tracking-tight">
          {title}
        </h3>
      )}

      <p className="text-white/20 text-sm max-w-sm mb-6">{message}</p>

      {onClear && (
        <button
          onClick={onClear}
          className="h-9 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-200">
          Clear Filters
        </button>
      )}
    </div>
  );
}
