export default function Textarea({
  label,
  name,
  placeholder = '',
  required = false,
  value,
  onChange,
  onBlur,
  error = '',
  touched = false,
}) {
  const isInvalid = touched && error;
  const isValid = touched && !error;

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block mb-2 text-sm font-normal text-gray-900">
        {label} {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`
          block w-full p-2.5 rounded-lg bg-gray-50 border text-sm min-h-[100px] resize-y focus:ring-2 focus:outline-none
          ${isInvalid
            ? 'bg-red-50 border-red-600 text-red-900 placeholder-red-700 focus:ring-red-300 focus:border-red-300'
            : isValid
            ? 'bg-green-50 border-green-600 text-green-900 placeholder-green-700 focus:ring-green-300 focus:border-green-300'
            : 'border-gray-300 text-gray-900 focus:ring-[#094074] focus:border-[#094074]'}
        `}
      />
      {isInvalid && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
