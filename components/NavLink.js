import Link from 'next/link';

export default function NavLink({ text, source }) {
  return (
    <Link
      className="text-[#094074] hover:text-[#c89933]"
      href={source}
    >
      {text}
    </Link>
  );
}
