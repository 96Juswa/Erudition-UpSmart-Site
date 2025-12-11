const RadioButton = ({
  name,
  value,
  label,
  checked,
  onChange,
  onBlur,
  isInvalid,
  isValid,
}) => {
  return (
    <label className="inline-flex items-center space-x-2 mb-2 cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        onBlur={onBlur}
        className={`
          appearance-none h-4 w-4 border border-gray-300 rounded-full checked:bg-[#094074] checked:border-[#094074]
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#094074]
          ${
            isInvalid
              ? 'border-red-600 text-red-900 focus:ring-red-300 focus:border-red-300'
              : isValid
                ? 'border-green-600 text-green-900 focus:ring-green-300 focus:border-green-300'
                : ''
          }
        `}
      />
      <span className="text-gray-900 text-sm">{label}</span>
    </label>
  );
};

export default RadioButton;
