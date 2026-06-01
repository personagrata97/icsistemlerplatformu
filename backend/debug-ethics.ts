
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { EthicsService } from './src/audit/ethics.service';
import { PrismaService } from './src/common/prisma.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ethicsService = app.get(EthicsService);
    const prismaService = app.get(PrismaService);

    const payload = {
        type: 'Genel Şikayet',
        anonymous: true,
        name: '',
        email: '',
        phone: '',
        description: 'Debug test description for 500 error analysis.',
        priority: 'Orta'
    };

    console.log('Starting debug...');

    try {
        const report = await ethicsService.createReport(payload, 'some-user-id');
        console.log('Report created successfully:', report);
    } catch (error) {
        console.error('ERROR CAUGHT IN DEBUG SCRIPT:');
        console.error(error);
    } finally {
        await app.close();
    }
}

bootstrap();
