import { Module } from '@nestjs/common';
import { SanctionController } from './sanction.controller';
import { SanctionService } from './sanction.service';
import { MasakService } from './masak.service';
import { PrismaService } from '../common/prisma.service';

@Module({
    controllers: [SanctionController],
    providers: [SanctionService, MasakService, PrismaService],
})
export class SanctionModule { }
