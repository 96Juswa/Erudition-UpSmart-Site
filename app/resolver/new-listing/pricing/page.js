import { getCurrentUser } from "@/app/lib/getCurrentUser";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewListingPricing from "@/components/NewListingPricing";

export default async function NewListingPricingPage() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div>
        <NewListingPricing />
      </div>

      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
