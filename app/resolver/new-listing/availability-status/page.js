import { getCurrentUser } from "@/app/lib/getCurrentUser";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewListingAvailabilityStatus from "@/components/NewListingAvailabilityStatus";

export default async function NewListingAvailabilityStatusPage() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div>
        <NewListingAvailabilityStatus />
      </div>

      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
