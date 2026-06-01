import { Controller, Get } from '@nestjs/common';
import { LiquidityStressService } from './liquidity-stress.service';

@Controller('risk/liquidity-stress')
export class LiquidityStressController {
    constructor(private readonly liquidityStressService: LiquidityStressService) { }

    @Get()
    async getStressResults() {
        return this.liquidityStressService.calculateAllScenarios();
    }
}
