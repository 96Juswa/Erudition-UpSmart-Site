import { getCurrentUser } from "@/app/lib/getCurrentUser";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ManageListings from "@/components/manage-listings";

export default async function ManageListingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div>
        <ManageListings />
      </div>

      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
