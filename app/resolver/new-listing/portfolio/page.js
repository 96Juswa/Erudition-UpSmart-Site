import { getCurrentUser } from "@/app/lib/getCurrentUser";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewListingPortfolio from "@/components/NewListingPortfolio";

export default async function NewListingPortfolioPage() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div>
        <NewListingPortfolio />
      </div>

      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
