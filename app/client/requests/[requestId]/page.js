import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RequestDetailContent from "@/components/RequestDetailContent";
import { getCurrentUser } from "@/app/lib/getCurrentUser";
import { cookies } from "next/headers";

export default async function RequestDetail({ params }) {
  const { requestId } = await params;
  const user = await getCurrentUser();

  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/requests/${requestId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch request ${requestId}`);
  }

  const request = await res.json();

  return (
    <div className="w-full flex flex-col gap-5 min-h-screen">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>
      <RequestDetailContent request={request} currentUser={user} />
      <Footer />
    </div>
  );
}
