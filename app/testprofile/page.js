import { getCurrentUser } from "@/app/lib/getCurrentUser";
import ProfileCard from "@/components/ProfileCard";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="p-6 text-center text-gray-600">
        Please log in to view your profile.
      </div>
    );
  }

  // Normalize user roles (array or single string)
  const roles = Array.isArray(user.userRoles)
    ? user.userRoles
    : user.userRoles
      ? [user.userRoles]
      : [];

  // Fallback if no roles detected
  const hasClientRole = roles.includes("client");
  const hasResolverRole = roles.includes("resolver");

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold mb-4">My Profile</h1>

      {/* Always show basic profile info */}
      {hasClientRole && (
        <div>
          <h2 className="text-lg font-medium mb-2 text-gray-700">
            Client Profile
          </h2>
          <ProfileCard userId={user.userId} role="client" />
        </div>
      )}

      {hasResolverRole && (
        <div>
          <h2 className="text-lg font-medium mb-2 text-gray-700">
            Resolver Profile
          </h2>
          <ProfileCard userId={user.userId} role="resolver" />
        </div>
      )}

      {/* Fallback if user has no roles */}
      {!hasClientRole && !hasResolverRole && (
        <div className="text-gray-500">No roles assigned to your account.</div>
      )}
    </div>
  );
}
