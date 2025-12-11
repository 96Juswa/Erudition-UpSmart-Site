import { getCurrentUser } from "@/app/lib/getCurrentUser";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ManagePortfolio from "@/components/ManagePortfolio";

export default async function ManagePortfolioPage() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div>
        <ManagePortfolio />
      </div>

      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
