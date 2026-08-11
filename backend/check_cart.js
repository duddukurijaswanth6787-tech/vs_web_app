const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.shoppingCartItem.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          media: {
            select: { url: true, isPrimary: true },
          },
        },
      },
    },
  });
  console.log('Cart Items Count:', items.length);
  console.log(JSON.stringify(items, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
