import { getCurrentUser } from "@/app/lib/getCurrentUser";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountSettings from "@/components/Settings";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div>
        <AccountSettings />
      </div>

      <div className="-mt-5">
        <Footer />
      </div>
    </div>
  );
}
