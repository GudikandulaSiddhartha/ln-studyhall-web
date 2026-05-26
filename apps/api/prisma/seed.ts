import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const central = await prisma.branch.upsert({
    where: { slug: "ln-central" },
    update: {},
    create: {
      name: "LN StudyHall Central",
      slug: "ln-central",
      address: "Main Road, Near City Library",
      landmark: "Opposite Metro Pillar 42",
      phone: "8555227719",
      latitude: 26.8467,
      longitude: 80.9462,
      openHours: "6 AM to 11 PM",
      facilities: ["Individual Cabins", "AC Rooms", "High-Speed WiFi", "CCTV Security"]
    }
  });

  await prisma.membership.createMany({
    data: [
      { name: "Daily Pass", slug: "daily-pass", price: 149, durationDays: 1, benefits: ["Any open seat", "WiFi", "QR attendance"] },
      { name: "Weekly Pass", slug: "weekly-pass", price: 799, durationDays: 7, benefits: ["Reserved time slot", "Priority support"] },
      { name: "Monthly Pass", slug: "monthly-pass", price: 2499, durationDays: 30, benefits: ["Dedicated seat", "Attendance history"] },
      { name: "Premium Cabin Plan", slug: "premium-cabin", price: 4999, durationDays: 30, benefits: ["Private cabin", "24/7 access", "Power backup"] }
    ],
    skipDuplicates: true
  });

  await prisma.seat.createMany({
    data: Array.from({ length: 72 }, (_, index) => ({
      branchId: central.id,
      label: `A-${String(index + 1).padStart(2, "0")}`,
      status: index % 11 === 0 ? "BLOCKED" : "AVAILABLE"
    })),
    skipDuplicates: true
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
