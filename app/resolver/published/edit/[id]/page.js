import { getCurrentUser } from "@/app/lib/getCurrentUser";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PublishedListingEdit from "@/components/PublishedEditListing";

export default async function PublishedListingEditPage() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div>
        <PublishedListingEdit />
      </div>

      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
