import { Module } from '@nestjs/common';
import { ControlController } from './control.controller';
import { ControlService } from './control.service';
import { PrismaService } from '../common/prisma.service';

@Module({
    controllers: [ControlController],
    providers: [ControlService, PrismaService],
    exports: [ControlService],
})
export class ControlModule {}
