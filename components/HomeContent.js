'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeContent({ user }) {
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    let targetRole = null;

    if (user.roles?.includes('admin')) {
      targetRole = 'admin';
    } else if (
      user.roles?.includes('client') &&
      user.roles?.includes('resolver')
    ) {
      const stored = localStorage.getItem('activeRole');
      targetRole = stored === 'resolver' ? 'resolver' : 'client';
    } else if (user.roles?.includes('client')) {
      targetRole = 'client';
    } else if (user.roles?.includes('resolver')) {
      targetRole = 'resolver';
    }

    if (targetRole) {
      router.replace(`/${targetRole}`);
    }
  }, [user, router]);

  return null; // Render nothing while redirecting
}
