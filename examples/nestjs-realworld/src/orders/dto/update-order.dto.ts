import { IntersectionType, OmitType, PartialType, PickType } from "@nestjs/swagger";
import { CreateOrderDto } from "./create-order.dto";

export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, ["status"] as const),
) {}

export class OrderSummaryDto extends PickType(CreateOrderDto, [
  "customerName",
  "status",
] as const) {}

export class UpdateOrderWithSummaryDto extends IntersectionType(
  UpdateOrderDto,
  OrderSummaryDto,
) {}
