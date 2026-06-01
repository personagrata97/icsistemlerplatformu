import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const props = Object.keys(prisma).filter(k => !k.startsWith('$'));
    console.log('Available models:', props.join(', '));
    await prisma.$disconnect();
}

main();
