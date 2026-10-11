import { Module } from '@nestjs/common';
import { ChargesController } from './charges.controller.js';
import { ChargesRepository } from './charges.repository.js';
import { ChargesService } from './charges.service.js';

@Module({
  controllers: [ChargesController],
  providers: [ChargesRepository, ChargesService],
})
export class ChargesModule {}
