import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: 'test1@example.com' },
    update: {},
    create: {
      email: 'test1@example.com',
      name: 'Test User 1',
      profileImage: 'https://via.placeholder.com/150',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'test2@example.com' },
    update: {},
    create: {
      email: 'test2@example.com',
      name: 'Test User 2',
      profileImage: 'https://via.placeholder.com/150',
    },
  });

  // Create test lots
  const lot1 = await prisma.lot.create({
    data: {
      title: 'Vintage Watch',
      description: 'A beautiful vintage watch from the 1950s',
      startPrice: 100,
      currentPrice: 100,
      images: ['https://via.placeholder.com/400x300'],
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'ACTIVE',
      sellerId: user1.id,
    },
  });

  const lot2 = await prisma.lot.create({
    data: {
      title: 'Antique Vase',
      description: 'An exquisite antique vase from the Ming Dynasty',
      startPrice: 500,
      currentPrice: 500,
      images: ['https://via.placeholder.com/400x300'],
      startTime: new Date(),
      endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'ACTIVE',
      sellerId: user2.id,
    },
  });

  // Create test bids
  await prisma.bid.create({
    data: {
      amount: 150,
      lotId: lot1.id,
      userId: user2.id,
    },
  });

  await prisma.bid.create({
    data: {
      amount: 600,
      lotId: lot2.id,
      userId: user1.id,
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 