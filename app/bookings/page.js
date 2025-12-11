import { getCurrentUser } from "@/app/lib/getCurrentUser";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingsPage from "@/components/BookingSummaryPage";

export default async function BookingsPageSummary() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div>
        <BookingsPage />
      </div>

      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
