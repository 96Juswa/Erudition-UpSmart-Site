import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/getCurrentUser";

export default async function MessagesIndex() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login"); // or wherever you handle unauthenticated users
  }

  redirect(`/messages/${user.userId}`);
}
