"use client";

import { useEffect, HTMLAttributes } from "react";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <div
        className={`relative bg-syndicate-surface border border-syndicate-border rounded-sm max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto ${className}`}
      >
        {title && (
          <div className="px-6 py-4 border-b border-syndicate-border flex items-center justify-between">
            <h2 className="text-lg font-mono font-bold text-syndicate-text">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-syndicate-muted hover:text-syndicate-text transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
