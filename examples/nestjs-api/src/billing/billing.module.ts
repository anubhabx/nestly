import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { Invoice } from './entities/invoice.entity';
import { Subscription } from './entities/subscription.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Invoice, Subscription])],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
