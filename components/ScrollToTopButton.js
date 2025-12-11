'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/Button';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      color="secondary"
      variant="filled"
      className="fixed bottom-6 right-6 z-50"
    >
      ↑ Top
    </Button>
  );
}
