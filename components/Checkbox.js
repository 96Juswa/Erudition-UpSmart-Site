'use client';

const Checkbox = ({
  label,
  name,
  checked,
  onChange,
  onBlur,
  error = '',
  touched,
  required = false,
  className = '',
}) => {
  const isInvalid = touched && error;
  const isValid = touched && !error;

  return (
    <div className="mb-4">
      <label
        className={`flex items-center mb-2 font-normal text-gray-900 ${
          className || 'text-sm'
        }`}
      >
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          className={`
            mr-2 h-4 w-4 rounded-lg border focus:ring-2 focus:outline-none accent-[#094074]
            ${
              isInvalid
                ? 'text-red-900 border-red-600 focus:ring-red-300'
                : isValid
                  ? 'text-green-900 border-green-600 focus:ring-green-300'
                  : 'border-gray-300 focus:ring-[#094074]'
            }
          `}
        />
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {isInvalid && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Checkbox;
