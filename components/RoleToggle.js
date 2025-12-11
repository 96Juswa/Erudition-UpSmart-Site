'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoleToggle({ value, onToggle }) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState(value || 'client');

  useEffect(() => {
    const storedRole = localStorage.getItem('activeRole');
    if (storedRole) {
      setActiveRole(storedRole);
    }
  }, []);

  const handleToggle = () => {
    const newRole = activeRole === 'resolver' ? 'client' : 'resolver';
    localStorage.setItem('activeRole', newRole);
    setActiveRole(newRole);
    onToggle?.(newRole); // if parent still handles some logic
    router.push(`/${newRole}`);
  };

  return (
    <div
      onClick={handleToggle}
      className="w-24 h-8 flex items-center justify-center rounded-full border border-[#094074] cursor-pointer relative bg-white"
      title={`Switch to ${activeRole === 'resolver' ? 'Client' : 'Resolver'} Mode`}
    >
      {/* Resolver Label */}
      <span
        className={`absolute right-8 text-xs text-gray-800 transition-opacity duration-300 ${
          activeRole === 'resolver' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Resolver
      </span>

      {/* Client Label */}
      <span
        className={`absolute right-6 text-xs text-gray-800 transition-opacity duration-300 ${
          activeRole === 'client' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Client
      </span>

      <div
        className="w-6 h-6 relative right-[-32px] rounded-full transition-transform duration-300 border border-black"
        style={{
          backgroundColor: activeRole === 'resolver' ? '#094074' : '#C89933',
          transform:
            activeRole === 'resolver' ? 'translateX(0)' : 'translateX(-64px)',
        }}
      ></div>
    </div>
  );
}
