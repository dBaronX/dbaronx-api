import { Module } from '@nestjs/common';
import { FastAPIService } from './fastapi.service';
import { getFundDreams, createFundDreamAsync } from './dreams';   // Correct relative path from integrations/ to src/dreams.ts

@Module({
  providers: [
    FastAPIService,
    // Add other providers here if you have more
  ],
  exports: [
    FastAPIService,
    // You can export the functions if needed by other modules
  ],
})
export class IntegrationsModule {}