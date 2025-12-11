import { getCurrentUser } from "../lib/getCurrentUser";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ResolverHome from "@/components/ResolverHome";

export default async function ResolverHomePage() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div className="-mt-5">
        <ResolverHome />
      </div>

      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
