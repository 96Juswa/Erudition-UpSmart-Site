'use client';

const InputBox = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error = '',
  touched = false,
  placeholder = '',
  required = false,
}) => {
  const isInvalid = touched && error;
  const isValid = touched && !error;

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block mb-2 text-sm font-normal text-gray-900"
      >
        {label} {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`
                    block w-full py-2 px-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:ring-[#094074] focus:border-[#094074] focus:ring-2 focus:outline-none
                    ${
                      isInvalid
                        ? 'bg-red-50 border border-red-600 text-red-900 placeholder-red-700 focus:ring-red-300 focus:border-red-300'
                        : isValid
                          ? 'bg-green-50 border border-green-600 text-green-900 placeholder-green-700 focus:ring-green-300 focus:border-green-300'
                          : 'border-gray-300 focus:ring-[#094074]'
                    }
                    }
                `}
      />
      {isInvalid && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default InputBox;
