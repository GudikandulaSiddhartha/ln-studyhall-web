import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding LN StudyHall database...");

  // ── Branches ────────────────────────────────────────────────────────────────
  const hanamkonda = await prisma.branch.upsert({
    where: { slug: "ln-hanamkonda" },
    update: {
      name: "LN Study Hall Hanamkonda",
      address: "Gopalapuram Cross Road, Near KU Cross, Opp. Baby Sainik School, Hanamkonda",
      landmark: "Opp. Baby Sainik School",
      phone: "8555827719",
      latitude: 18.0108,
      longitude: 79.5586,
      openHours: "6:00 AM - 11:00 PM",
      facilities: ["Individual Cabins", "AC Study Hall", "High-Speed WiFi", "CCTV Security", "Drinking Water", "Power Backup"]
    },
    create: {
      name: "LN Study Hall Hanamkonda",
      slug: "ln-hanamkonda",
      address: "Gopalapuram Cross Road, Near KU Cross, Opp. Baby Sainik School, Hanamkonda",
      landmark: "Opp. Baby Sainik School",
      phone: "8555827719",
      latitude: 18.0108,
      longitude: 79.5586,
      openHours: "6:00 AM - 11:00 PM",
      facilities: ["Individual Cabins", "AC Study Hall", "High-Speed WiFi", "CCTV Security", "Drinking Water", "Power Backup"]
    }
  });

  const warangal = await prisma.branch.upsert({
    where: { slug: "ln-warangal" },
    update: {
      name: "LN Study Hall Warangal",
      address: "Near Warangal Bus Stand, Warangal",
      landmark: "Near Warangal Bus Stand",
      phone: "8555827719",
      latitude: 17.9784,
      longitude: 79.6000,
      openHours: "6:00 AM - 11:00 PM",
      facilities: ["Individual Cabins", "AC Study Hall", "High-Speed WiFi", "CCTV Security", "Drinking Water"]
    },
    create: {
      name: "LN Study Hall Warangal",
      slug: "ln-warangal",
      address: "Near Warangal Bus Stand, Warangal",
      landmark: "Near Warangal Bus Stand",
      phone: "8555827719",
      latitude: 17.9784,
      longitude: 79.6000,
      openHours: "6:00 AM - 11:00 PM",
      facilities: ["Individual Cabins", "AC Study Hall", "High-Speed WiFi", "CCTV Security", "Drinking Water"]
    }
  });

  console.log(`✅ Branches: ${hanamkonda.name} (${hanamkonda.id}), ${warangal.name} (${warangal.id})`);

  // ── Delete old seats and recreate ──────────────────────────────────────────
  await prisma.seat.deleteMany({ where: { branchId: hanamkonda.id } });
  await prisma.seat.deleteMany({ where: { branchId: warangal.id } });

  // Hanamkonda — 72 seats numbered 1–72
  await prisma.seat.createMany({
    data: Array.from({ length: 72 }, (_, i) => ({
      branchId: hanamkonda.id,
      label: String(i + 1),
      status: "AVAILABLE" as const
    }))
  });

  // Warangal — 42 seats numbered 1–42
  await prisma.seat.createMany({
    data: Array.from({ length: 42 }, (_, i) => ({
      branchId: warangal.id,
      label: String(i + 1),
      status: "AVAILABLE" as const
    }))
  });

  console.log(`✅ Seats: 72 for Hanamkonda, 42 for Warangal`);

  // ── Memberships ─────────────────────────────────────────────────────────────
  await prisma.membership.createMany({
    data: [
      {
        name: "Monthly Pass",
        slug: "monthly-pass",
        price: 1500,
        durationDays: 30,
        benefits: ["Reading room access", "AC study hall", "High-speed WiFi", "Individual cabins", "Drinking water", "CCTV security"],
        isActive: true
      }
    ],
    skipDuplicates: true
  });

  console.log("✅ Memberships seeded");
  console.log("🎉 Database seeding complete!");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
