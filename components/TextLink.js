import Link from 'next/link';

export default function TextLink({ text, source, className = '' }) {
  return (
    <Link
      className={`text-[#094074] hover:text-[#062c4d] hover:underline ${className}`}
      href={source}
    >
      {text}
    </Link>
  );
}
