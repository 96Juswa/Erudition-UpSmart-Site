import { getCurrentUser } from "@/app/lib/getCurrentUser";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoriesPage from "@/components/CategoriesPage";

export default async function CategoriesPages() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div>
        <CategoriesPage />
      </div>

      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
