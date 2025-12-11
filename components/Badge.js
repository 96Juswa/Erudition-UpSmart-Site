export default function Badge({ text, variant = 'primary', className = '' }) {
  const baseClasses = 'text-sm font-medium px-3 py-1 rounded-full';

  const variants = {
    primary: 'text-[#094074] bg-[#e3edf6]',
    success: 'text-green-700 bg-green-100',
    danger: 'text-red-700 bg-red-100',
    warning: 'text-yellow-700 bg-yellow-100',
    info: 'text-blue-700 bg-blue-100',
  };

  return (
    <span
      className={`${baseClasses} ${variants[variant] || variants.primary} ${className}`}
    >
      {text}
    </span>
  );
}
