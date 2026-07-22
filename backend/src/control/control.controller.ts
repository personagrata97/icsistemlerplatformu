import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ControlService } from './control.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('control')
@UseGuards(JwtAuthGuard)
export class ControlController {
    constructor(private readonly controlService: ControlService) {}

    @Get('stats')
    async getStats() {
        return this.controlService.getControlStats();
    }

    @Get('inventory')
    async getInventory(
        @Query('search') search?: string,
        @Query('type') type?: string,
        @Query('status') status?: string,
    ) {
        return this.controlService.getControlInventory({ search, type, status });
    }

    @Get('self-assessment')
    async getSelfAssessments() {
        return this.controlService.getSelfAssessments();
    }
}
