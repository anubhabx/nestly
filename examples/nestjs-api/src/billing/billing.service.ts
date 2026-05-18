import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckoutSessionDto } from './dto/checkout-session.dto';
import { CheckoutSessionResponseDto } from './dto/checkout-session-response.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { Invoice } from './entities/invoice.entity';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
  ) {}

  async getSubscription(accountId: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptions.findOne({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return this.toSubscriptionResponse(subscription);
  }

  createCheckoutSession(
    accountId: string,
    dto: CheckoutSessionDto,
  ): CheckoutSessionResponseDto {
    return {
      id: `cs_${accountId.replace(/-/g, '').slice(0, 12)}`,
      url: `${dto.successUrl}?checkout=mocked&plan=${dto.planCode}&interval=${dto.interval}`,
      expiresIn: 1800,
    };
  }

  async listInvoices(
    accountId: string,
    query: InvoiceQueryDto,
  ): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoices.find({
      where: query.status ? { accountId, status: query.status } : { accountId },
      order: { createdAt: 'DESC' },
    });
    return invoices.map((invoice) => this.toInvoiceResponse(invoice));
  }

  private toSubscriptionResponse(
    subscription: Subscription,
  ): SubscriptionResponseDto {
    return {
      id: subscription.id,
      accountId: subscription.accountId,
      planCode: subscription.planCode,
      interval: subscription.interval,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
    };
  }

  private toInvoiceResponse(invoice: Invoice): InvoiceResponseDto {
    return {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      dueAt: invoice.dueAt.toISOString(),
    };
  }
}
