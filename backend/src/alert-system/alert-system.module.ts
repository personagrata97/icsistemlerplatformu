import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AlertService } from './alert.service';
import { AlertController } from './alert.controller';

@Module({
    providers: [PrismaService, AlertService],
    controllers: [AlertController],
    exports: [AlertService],
})
export class AlertSystemModule { }
