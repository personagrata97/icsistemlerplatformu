import { Module } from '@nestjs/common';
import { PharosController } from './pharos.controller';
import { PharosService } from './pharos.service';
import { PrismaService } from '../common/prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    controllers: [PharosController],
    providers: [PharosService, PrismaService],
    exports: [PharosService],
})
export class PharosModule { }
