import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RequestDetailContent from "@/components/RequestDetailContent";
import { getCurrentUser } from "@/app/lib/getCurrentUser";

export default async function RequestDetail({ params }) {
  const { requestId } = await params;
  const user = await getCurrentUser();

  // 🔄 Fetch request data
  const requestRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/requests/${requestId}`,
    { cache: "no-store" }
  );

  if (!requestRes.ok) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-screen text-center text-red-600">
        <Navbar user={user} />
        <p className="mt-20 text-lg font-semibold">Failed to load request.</p>
        <Footer />
      </div>
    );
  }

  const request = await requestRes.json();

  // 🔄 Fetch comments for this request
  const commentsRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/comments/${requestId}`,
    { cache: "no-store" }
  );

  const comments = commentsRes.ok ? await commentsRes.json() : [];

  return (
    <div className="w-full flex flex-col gap-5 min-h-screen">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>
      <RequestDetailContent
        request={request}
        comments={comments}
        currentUser={user}
      />
      <Footer />
    </div>
  );
}
