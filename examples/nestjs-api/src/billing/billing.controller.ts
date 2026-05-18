import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { CheckoutSessionDto } from './dto/checkout-session.dto';
import { CheckoutSessionResponseDto } from './dto/checkout-session-response.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('subscription')
  @ApiOperation({ operationId: 'getSubscription', summary: 'Get subscription' })
  @ApiOkResponse({
    description: 'Subscription returned.',
    type: SubscriptionResponseDto,
  })
  subscription(
    @CurrentUser() user: RequestUser,
  ): Promise<SubscriptionResponseDto> {
    return this.billing.getSubscription(user.accountId ?? 'default-account');
  }

  @Post('checkout-sessions')
  @Roles('admin', 'owner', 'billing')
  @ApiOperation({
    operationId: 'createCheckoutSession',
    summary: 'Create checkout session',
  })
  @ApiCreatedResponse({
    description: 'Checkout session created.',
    type: CheckoutSessionResponseDto,
  })
  checkout(
    @CurrentUser() user: RequestUser,
    @Body() dto: CheckoutSessionDto,
  ): CheckoutSessionResponseDto {
    return this.billing.createCheckoutSession(
      user.accountId ?? 'default-account',
      dto,
    );
  }

  @Get('invoices')
  @ApiOperation({ operationId: 'listInvoices', summary: 'List invoices' })
  @ApiOkResponse({
    description: 'Invoices returned.',
    type: [InvoiceResponseDto],
  })
  invoices(
    @CurrentUser() user: RequestUser,
    @Query() query: InvoiceQueryDto,
  ): Promise<InvoiceResponseDto[]> {
    return this.billing.listInvoices(
      user.accountId ?? 'default-account',
      query,
    );
  }
}
