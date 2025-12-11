import React from 'react';

export default function ButtonIcon({
  onClick,
  icon: Icon,
  className = '',
  ariaLabel = 'Icon button',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-white bg-[#094074] hover:bg-[#062c4d] focus:ring-4 focus:outline-none focus:ring-[#e6f0fa] font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center me-2 ${className}`}
    >
      {Icon && (
        <Icon
          className="w-4 h-4"
          aria-hidden="true"
        />
      )}
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
}
