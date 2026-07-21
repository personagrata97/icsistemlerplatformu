import { Controller, Get, UseGuards } from '@nestjs/common';
import { LiquidityStressService } from './liquidity-stress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('risk/liquidity-stress')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LiquidityStressController {
    constructor(private readonly liquidityStressService: LiquidityStressService) { }

    @Get()
    async getStressResults() {
        return this.liquidityStressService.calculateAllScenarios();
    }
}
