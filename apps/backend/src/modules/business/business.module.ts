import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller.js';
import { BusinessRepository } from './business.repository.js';
import { BusinessService } from './business.service.js';

@Module({
  controllers: [BusinessController],
  providers: [BusinessRepository, BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
