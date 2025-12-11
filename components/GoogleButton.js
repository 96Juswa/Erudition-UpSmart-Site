import { signIn } from "next-auth/react";

export default function GoogleButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="px-4 py-2 w-full text-sm border flex justify-center gap-2 border-[#094074] rounded-lg text-[#094074] hover:bg-[#094074] hover:text-white"
    >
      <img
        className="w-6 h-6"
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        loading="lazy"
        alt="google's logo"
      />
      <span>Continue with Google</span>
    </button>
  );
}
