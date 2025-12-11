'use client';

// Base style of the button
const baseStyle =
  'inline-flex items-center font-medium rounded-lg text-center me-2 mb-2 focus:outline-none focus:ring-4';

// Color profiles
const COLOR_MAP = {
  primary: {
    filled:
      'bg-[#094074] hover:bg-[#062c4d] focus:ring-[#e6f0fa] text-white border border-[#094074]',
    outline:
      'text-[#094074] border border-[#094074] hover:bg-[#094074] hover:text-white focus:ring-[#e6f0fa]',
  },
  secondary: {
    filled:
      'bg-gray-800 hover:bg-gray-900 focus:ring-gray-300 text-white border border-gray-800',
    outline:
      'text-gray-800 border border-gray-800 hover:bg-gray-800 hover:text-white focus:ring-gray-300',
  },
  success: {
    filled:
      'bg-green-600 hover:bg-green-700 focus:ring-green-300 text-white border border-green-600',
    outline:
      'text-green-600 border border-green-600 hover:bg-green-600 hover:text-white foxus:ring-green-300',
  },
  danger: {
    filled:
      'bg-red-600 hover:bg-red-700 focus:ring-red-300 text-white border border-red-600',
    outline:
      'text-red-600 border border-red-600 hover:bg-red-600 hover:text-white focus:ring-red-300',
  },
  warning: {
    filled:
      'bg-amber-500 hover:bg-amber-600 focus:ring-amber-300 text-white border border-amber-500',
    outline:
      'text-amber-500 border border-amber-500 hover:bg-amber-500 hover:text-white focus:ring-amber-300',
  },
  info: {
    filled:
      'bg-purple-600 hover:bg-purple-700 focus:ring-purple-300 text-white border border-purple-600',
    outline:
      'text-purple-600 border border-purple-600 hover:bg-purple-600 hover:text-white focus:ring-purple-300',
  },
};

// Size profiles
const SIZE_MAP = {
  xs: 'px-3 py-2 text-xs',
  sm: 'px-3 py-2 text-sm',
  base: 'px-5 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
  xl: 'px-6 py-3.5 text-base',
};

export default function Button({
  type = 'button',
  variant = 'filled',
  color = 'primary',
  size = 'base',
  iconStart = null,
  iconEnd = null,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const baseStyle =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg text-center focus:outline-none focus:ring-4';

  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const style = [
    baseStyle,
    SIZE_MAP[size],
    COLOR_MAP[color]?.[variant],
    disabledStyle,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      disabled={disabled}
      className={style}
      {...props}
    >
      {iconStart && (
        <span className="inline-flex items-center justify-center">
          {iconStart}
        </span>
      )}
      {children}
      {iconEnd && (
        <span className="inline-flex items-center justify-center">
          {iconEnd}
        </span>
      )}
    </button>
  );
}
