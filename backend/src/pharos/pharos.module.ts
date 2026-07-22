import { Module } from '@nestjs/common';
import { PharosController } from './pharos.controller';
import { PharosService } from './pharos.service';
import { PrismaService } from '../common/prisma.service';

@Module({
    controllers: [PharosController],
    providers: [PharosService, PrismaService],
    exports: [PharosService],
})
export class PharosModule { }
