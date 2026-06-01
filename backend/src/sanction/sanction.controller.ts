import { Controller, Get, Post, Body } from '@nestjs/common';
import { SanctionService } from './sanction.service';

@Controller('sanction')
export class SanctionController {
    constructor(private readonly sanctionService: SanctionService) { }

    @Get('logs')
    async getLogs() {
        return this.sanctionService.getLogs();
    }

    @Post('logs')
    async createLog(@Body() data: any) {
        return this.sanctionService.createLog(data);
    }
}
