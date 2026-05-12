import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { AddressDto } from "./address.dto";
import { OrderStatus } from "../order-status.enum";

export class CreateOrderDto {
  @ApiProperty({ example: "Acme Ltd", minLength: 2 })
  @IsString()
  customerName: string;

  @ApiProperty({ enum: OrderStatus, enumName: "OrderStatus", default: OrderStatus.Draft })
  @IsEnum(OrderStatus)
  status: OrderStatus = OrderStatus.Draft;

  @ApiProperty({ type: () => AddressDto })
  shippingAddress: AddressDto;

  @ApiPropertyOptional({ type: [String], example: ["fragile", "gift"] })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ minimum: 1, example: 3 })
  @IsInt()
  @Min(1)
  quantity: number;
}
