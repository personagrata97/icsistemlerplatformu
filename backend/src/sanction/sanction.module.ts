import { Module } from '@nestjs/common';
import { SanctionController } from './sanction.controller';
import { SanctionService } from './sanction.service';
import { MasakService } from './masak.service';
import { SanctionImportService } from './sanction-import.service';
import { SanctionCronService } from './sanction-cron.service';
import { PrismaService } from '../common/prisma.service';

@Module({
    controllers: [SanctionController],
    providers: [SanctionService, MasakService, SanctionImportService, SanctionCronService, PrismaService],
    exports: [SanctionService, SanctionImportService, SanctionCronService]
})
export class SanctionModule { }
