import { Module } from '@nestjs/common';
import { IndicatorsController } from './controllers/indicators.controller';
import { IndicatorsService } from './services/indicators.service';
import { IndicatorsRepository } from './repositories/indicators.repository';

@Module({
  controllers: [IndicatorsController],
  providers: [IndicatorsService, IndicatorsRepository],
  exports: [IndicatorsService],
})
export class IndicatorsModule {}
