import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-mono text-syndicate-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`px-3 py-2 bg-syndicate-surface border border-syndicate-border rounded-sm text-syndicate-text font-mono text-sm placeholder:text-syndicate-muted focus:outline-none focus:border-syndicate-text transition-colors ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs font-mono text-red-400">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-mono text-syndicate-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`px-3 py-2 bg-syndicate-surface border border-syndicate-border rounded-sm text-syndicate-text font-mono text-sm placeholder:text-syndicate-muted focus:outline-none focus:border-syndicate-text transition-colors resize-none ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs font-mono text-red-400">{error}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
