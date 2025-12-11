import { getCurrentUser } from "@/app/lib/getCurrentUser";
import Navbar from "@/components/Navbar";
import MessagingLayoutPage from "@/components/MessagingLayoutPage";

export default async function Page({ params }) {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="w-full flex flex-col gap-5">
      <div className="px-10 pt-10">
        <Navbar user={user} />
      </div>

      <div className="px-10 pt-5">
        <MessagingLayoutPage currentUserId={user.userId} />
      </div>
    </div>
  );
}
