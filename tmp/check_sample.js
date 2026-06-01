
const { PrismaClient } = require('@prisma/client');
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
  
  if (lastSample.selectedItems) {
    const items = JSON.parse(lastSample.selectedItems);
    if (Array.isArray(items)) {
      console.log('Number of items selected:', items.length);
      
      const distribution = {};
      const firstItem = items[0];
      if (!firstItem) return;

      const branchColumn = Object.keys(firstItem).find(k => 
        k.toLowerCase().includes('şube') || 
        k.toLowerCase().includes('sube') || 
        k.toLowerCase().includes('branch') ||
        k.toLowerCase().includes('unit') ||
        k.toLowerCase().includes('birim')
      );
      
      if (branchColumn) {
        items.forEach((item) => {
          const branch = item[branchColumn] || 'Unknown';
          distribution[branch] = (distribution[branch] || 0) + 1;
        });
        console.log('\nDistribution by ' + branchColumn + ':');
        console.log(JSON.stringify(distribution, null, 2));
      } else {
        console.log('\nNo suitable grouping column found in items. Headers:', Object.keys(firstItem));
      }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
