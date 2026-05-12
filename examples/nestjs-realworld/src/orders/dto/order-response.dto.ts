import { ApiProperty, ApiResponseProperty } from "@nestjs/swagger";
import { CreateOrderDto } from "./create-order.dto";
import { OrderStatus } from "../order-status.enum";

export class OrderResponseDto extends CreateOrderDto {
  @ApiResponseProperty({ example: "ord_123", readOnly: true })
  id: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.Submitted })
  status: OrderStatus;

  static _OPENAPI_METADATA_FACTORY() {
    return {
      createdAt: {
        required: true,
        type: () => String,
        format: "date-time",
        example: "2026-05-12T10:30:00.000Z",
        readOnly: true,
      },
    };
  }
}
