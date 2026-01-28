import React from "react";

const Button = ({
  label = "Submit",
  type = "submit",
  className = "",
  disabled = false,
  onClick,
  children,
  variant = "primary", // ✅ Added variants
  fullWidth = false,   // ✅ Added fullWidth option
  size = "md",         // ✅ Added size options
  loading = false,     // ✅ Added loading state
}) => {
  // ✅ Variant styles
  const variants = {
    primary: "bg-primary hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
    outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
  };

  // ✅ Size styles
  const sizes = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-lg",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${fullWidth ? "w-full" : "w-auto"}
        ${variants[variant]}
        ${sizes[size]}
        font-semibold rounded-xl transition duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${loading ? "cursor-wait" : ""}
        ${className}
      `}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children || label
      )}
    </button>
  );
};

export default Button;