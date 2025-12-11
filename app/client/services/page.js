import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServicesClient from "@/components/ServicesClient";
import { getCurrentUser } from "../../lib/getCurrentUser";

export default async function Services() {
  const user = await getCurrentUser();

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/services`, {
    cache: "no-store",
  });

  const allServices = await res.json();

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div className="px-10">
        <ServicesClient allServices={allServices} />
      </div>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
