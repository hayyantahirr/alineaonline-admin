"use client";

const variants = {
  primary:
    "bg-primary text-dark hover:bg-primary-hover font-semibold shadow-sm",
  secondary:
    "bg-dark text-white hover:bg-dark-hover font-semibold shadow-sm",
  outline:
    "border-2 border-dark text-dark hover:bg-dark hover:text-white font-semibold",
  danger:
    "bg-danger text-white hover:bg-red-700 font-semibold shadow-sm",
  ghost:
    "text-dark hover:bg-gray-100 font-medium",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-lg gap-2",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center cursor-pointer
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />}
      {children}
    </button>
  );
}
