"use client";

const variants = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  default: "bg-gray-100 text-gray-600",
};

export default function Badge({ children, variant = "default", className = "" }) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium
        font-[family-name:var(--font-ibm-plex-mono)]
        ${variants[variant] || variants.default}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
