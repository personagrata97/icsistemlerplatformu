
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module'; // Adjust path if needed
import { EthicsService } from './src/audit/ethics.service';
import { PrismaService } from './src/common/prisma.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ethicsService = app.get(EthicsService);
    const prismaService = app.get(PrismaService);

    console.log('Starting query debug...');

    try {
        const code = 'UGMP-MWTX-7V6P-3247';
        console.log(`Querying actual report ${code}...`);
        const found = await ethicsService.queryReportByCode(code, '127.0.0.1', 'DebugScript');
        console.log('Query result:', found ? 'FOUND' : 'NOT FOUND');
        if (found) {
            console.log('Report JSON:', JSON.stringify(found, null, 2));
            console.log('createdAt TYPE:', typeof found.createdAt, found.createdAt);
            console.log('created_at TYPE:', typeof found.created_at, found.created_at);
        }

        // 3. Clean up
        // await prismaService.ethicsReport.delete({ where: { id: report.id } });
    } catch (error) {
        console.error('DEBUG ERROR:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
