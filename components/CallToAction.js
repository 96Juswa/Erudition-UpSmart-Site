'use client';

import { Users } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function CallToAction() {
  const router = useRouter();
  const signup = () => router.push('/signup');

  return (
    <div className="relative w-full h-[500px]">
      {/* Background Image */}
      <Image
        src="/images/jru-student-4.png"
        alt="Students collaborating"
        layout="fill"
        objectFit="cover"
        className="z-0"
        priority
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#094074]/70 z-10 flex items-center justify-center px-6">
        <div className="text-center text-white max-w-2xl">
          <div className="flex justify-center mb-4">
            <Users className="w-10 h-10 text-[#c89933]" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Join a community where students support students.
          </h2>
          <p className="text-blue-100 mb-6">
            Get help, build your skills, and grow together—right here at JRU.
            Whether you're looking to collaborate or contribute, this is your
            space to thrive.
          </p>
          <button
            type="button"
            onClick={signup}
            className="flex items-center gap-2 bg-[#c89933] text-[#094074] font-semibold px-6 py-3 rounded-md hover:bg-amber-500 transition mx-auto"
          >
            <Users className="w-5 h-5" />
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
