import React from "react";

const Input = ({
  label = "",
  id = "",
  name = "",           // ✅ Added name attribute
  type = "text",
  className = "",
  inputClassName = "",
  isRequired = false,
  placeholder = "",
  value = "",
  onChange = () => {},
  onKeyDown = () => {}, // ✅ Added for Enter key handling
  disabled = false,     // ✅ Added disabled state
  error = "",          // ✅ Added error message
  icon,                // ✅ Added icon support
  autoComplete = "off", // ✅ Added autocomplete
  maxLength,           // ✅ Added maxLength
  rows,                // ✅ For textarea
}) => {
  const inputId = id || name || label.toLowerCase().replace(/\s+/g, "-");

  // ✅ Determine if it's a textarea
  const isTextarea = type === "textarea";

  const inputClasses = `
    bg-gray-50 border text-gray-900 text-sm rounded-lg 
    focus:ring-blue-500 focus:border-blue-500 w-full p-2.5
    disabled:bg-gray-200 disabled:cursor-not-allowed
    ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"}
    ${icon ? "pl-10" : ""}
    ${inputClassName}
  `;

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-800 mb-1"
        >
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* ✅ Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {icon}
          </div>
        )}

        {/* ✅ Input or Textarea */}
        {isTextarea ? (
          <textarea
            id={inputId}
            name={name || inputId}
            placeholder={placeholder}
            required={isRequired}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            disabled={disabled}
            maxLength={maxLength}
            rows={rows || 4}
            className={inputClasses}
          />
        ) : (
          <input
            type={type}
            id={inputId}
            name={name || inputId}
            placeholder={placeholder}
            required={isRequired}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            disabled={disabled}
            autoComplete={autoComplete}
            maxLength={maxLength}
            className={inputClasses}
          />
        )}
      </div>

      {/* ✅ Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {/* ✅ Character Count */}
      {maxLength && value && (
        <p className="mt-1 text-xs text-gray-500 text-right">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};

export default Input;