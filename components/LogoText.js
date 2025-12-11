// components/LogoText.js
import Link from "next/link";

export default function LogoText() {
  return (
    <Link href="/">
      <h1 className="text-[#c89933] text-xl">
        UP<span className="text-[#094074]">SMART</span>
      </h1>
    </Link>
  );
}
