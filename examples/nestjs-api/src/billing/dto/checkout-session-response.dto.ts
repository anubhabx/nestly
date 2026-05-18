import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';

export class CheckoutSessionResponseDto {
  @ApiResponseProperty({ example: 'cs_test_1P9wsKLkdIwHu7ix' })
  id: string;

  @ApiProperty({
    example: 'https://checkout.stripe.com/c/pay/cs_test_1P9wsKLkdIwHu7ix',
  })
  url: string;

  @ApiProperty({ example: 1800 })
  expiresIn: number;
}
