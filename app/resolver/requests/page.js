import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RequestsContent from "@/components/RequestsContent";
import { getCurrentUser } from "@/app/lib/getCurrentUser";

export default async function Requests() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col min-h-screen gap-5">
      <div className="px-10 pt-10">
        <Navbar user={user} />

        {user ? (
          <RequestsContent />
        ) : (
          <div className="text-center text-gray-500 mt-10">
            <p>You must be logged in to view your requests.</p>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
