// app/api/admin/test/route.js

import { requireAdmin } from "@/middleware/adminAuth";

export async function GET(req) {
  const { admin, error } = await requireAdmin(req);
  if (error) return error;

  return new Response(
    JSON.stringify({
      message: "Admin access works!",
      admin: {
        email: admin.email,
        name: `${admin.firstName} ${admin.lastName}`,
        roles: admin.userRoles.map((ur) => ur.role.roleName),
      },
    }),
    { status: 200 }
  );
}
