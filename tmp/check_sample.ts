
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lastSample = await prisma.auditSample.findFirst({
    orderBy: { created_at: 'desc' },
  });

  if (!lastSample) {
    console.log('No sampling plans found.');
    return;
  }

  console.log('--- Last Sampling Plan ---');
  console.log('Title:', lastSample.title);
  console.log('Method:', lastSample.method);
  console.log('Sample Size:', lastSample.sampleSize);
  console.log('Population Size:', lastSample.populationSize);
  console.log('Status:', lastSample.status);
  console.log('Created At:', lastSample.created_at);
  
  if (lastSample.selectedItems) {
    const items = JSON.parse(lastSample.selectedItems);
    if (Array.isArray(items)) {
      console.log('Number of items selected:', items.length);
      
      // Analyze distribution by a common column like 'Şube' or 'Şube Adı'
      const distribution: Record<string, number> = {};
      const branchColumn = Object.keys(items[0]).find(k => k.toLowerCase().includes('şube'));
      
      if (branchColumn) {
        items.forEach((item: any) => {
          const branch = item[branchColumn] || 'Unknown';
          distribution[branch] = (distribution[branch] || 0) + 1;
        });
        console.log('\nDistribution by', branchColumn, ':');
        console.table(distribution);
      } else {
        console.log('\nNo "Şube" column found in items. Headers:', Object.keys(items[0]));
      }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
