import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({
    take: 5,
    select: { id: true, name: true, slug: true, finalPrice: true, images: true }
  });
  console.log(JSON.stringify(products, null, 2));
}
main();
