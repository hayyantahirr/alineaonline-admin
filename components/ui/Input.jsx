"use client";

import { Search } from "lucide-react";

export function Input({ label, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-dark">{label}</label>
      )}
      <input
        className={`
          w-full px-4 py-2.5 rounded-lg border border-gray-200
          text-sm text-dark placeholder:text-gray-400
          bg-white
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

export function SearchInput({ className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        className="
          w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200
          text-sm text-dark placeholder:text-gray-400
          bg-white
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all duration-200
        "
        {...props}
      />
    </div>
  );
}

export function Select({ label, options = [], className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-dark">{label}</label>
      )}
      <select
        className={`
          w-full px-4 py-2.5 rounded-lg border border-gray-200
          text-sm text-dark bg-white
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all duration-200 cursor-pointer
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-dark">{label}</label>
      )}
      <textarea
        className={`
          w-full px-4 py-2.5 rounded-lg border border-gray-200
          text-sm text-dark placeholder:text-gray-400
          bg-white resize-vertical min-h-[100px]
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
