const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const attributes = await prisma.attribute.findMany({
    include: {
      options: true,
      group: true
    }
  });

  console.log('ATTRIBUTES IN DB:');
  console.log(JSON.stringify(attributes, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
