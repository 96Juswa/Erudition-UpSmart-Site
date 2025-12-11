const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  // Seed roles
  await prisma.role.createMany({
    data: [
      { roleName: "client" },
      { roleName: "resolver" },
      { roleName: "admin" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Roles seeded successfully");

  // Get admin role ID
  const adminRole = await prisma.role.findUnique({
    where: { roleName: "admin" },
  });

  if (!adminRole) {
    throw new Error("Admin role not found!");
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash("Admin@JRU2024!", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@my.jru.edu" },
    update: {}, // Don't update if exists
    create: {
      email: "admin@my.jru.edu",
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      middleName: null,
      userRoles: {
        create: {
          roleId: adminRole.roleId,
        },
      },
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  console.log("✅ Default admin user created/verified:");
  console.log(`   Email: ${adminUser.email}`);
  console.log(
    `   Password: Admin@JRU2024! (CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN)`
  );
  console.log(
    `   Roles: ${adminUser.userRoles.map((ur) => ur.role.roleName).join(", ")}`
  );

  // ✅ Seed platform setting (singleton)
  await prisma.platformSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      transactionFeeOn: false,
      feePercentage: 3.0,
    },
  });

  console.log("✅ Platform setting seeded successfully");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
