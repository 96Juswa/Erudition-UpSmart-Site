import { notFound } from "next/navigation";
import ServiceDetailContent from "@/components/ServiceDetailContent";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/app/lib/getCurrentUser";

export default async function ServiceDetail({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/services/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) return notFound();

  const service = await res.json();

  return (
    <div className="w-full flex flex-col gap-5 h-screen">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>
      <ServiceDetailContent service={service} currentUser={user} />
      <Footer />
    </div>
  );
}
