// components/LogoImage.js
import Link from "next/link";

export default function LogoImage() {
  return (
    <Link href="/">
      <img src="/images/logo.png" className="w-12" />
    </Link>
  );
}
