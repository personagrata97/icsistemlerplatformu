import { Module } from '@nestjs/common';
import { SanctionController } from './sanction.controller';
import { SanctionService } from './sanction.service';
import { MasakService } from './masak.service';
import { SanctionImportService } from './sanction-import.service';
import { SanctionCronService } from './sanction-cron.service';
import { ReputationSignalService } from './reputation-signal.service';
import { PrismaService } from '../common/prisma.service';

@Module({
    controllers: [SanctionController],
    providers: [SanctionService, MasakService, SanctionImportService, SanctionCronService, ReputationSignalService, PrismaService],
    exports: [SanctionService, SanctionImportService, SanctionCronService, ReputationSignalService]
})
export class SanctionModule { }
