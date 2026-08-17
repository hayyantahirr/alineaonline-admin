"use client";

export default function Card({ children, className = "", header, footer, noPadding = false, ...props }) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100
        transition-shadow duration-200 hover:shadow-md
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-100">{header}</div>
      )}
      <div className={noPadding ? "" : "p-6"}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100">{footer}</div>
      )}
    </div>
  );
}
