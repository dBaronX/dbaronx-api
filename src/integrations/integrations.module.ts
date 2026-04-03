// src/integrations/integrations.module.ts
import { Module } from '@nestjs/common';
import { FastAPIService } from './fastapi.service';
import { DreamsIntegration } from './dreams';

@Module({
  providers: [FastAPIService, DreamsIntegration],
  exports: [FastAPIService, DreamsIntegration],
})
export class IntegrationsModule {}