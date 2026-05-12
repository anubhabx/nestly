import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { CreateOrderDto } from "./dto/create-order.dto";
import {
  OrderSummaryDto,
  UpdateOrderDto,
  UpdateOrderWithSummaryDto,
} from "./dto/update-order.dto";
import { OrderResponseDto } from "./dto/order-response.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("Orders")
@ApiBearerAuth("bearerAuth")
@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  @Get()
  @ApiOperation({
    operationId: "listOrders",
    summary: "List orders",
    description: "Returns visible orders for the current account.",
  })
  @ApiOkResponse({
    description: "Orders returned.",
    type: OrderResponseDto,
    isArray: true,
  })
  list(@Query() query: OrderSummaryDto): Promise<OrderResponseDto[]> {
    return Promise.resolve([]);
  }

  @Post()
  @ApiOperation({ operationId: "createOrder", summary: "Create order" })
  @ApiCreatedResponse({
    description: "Order created.",
    type: OrderResponseDto,
  })
  create(@Body() body: CreateOrderDto): Promise<OrderResponseDto> {
    return Promise.resolve({} as OrderResponseDto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Patch order" })
  @ApiOkResponse({ description: "Order updated.", type: OrderResponseDto })
  update(
    @Param("id") id: string,
    @Body() body: UpdateOrderWithSummaryDto,
  ): Promise<OrderResponseDto> {
    return Promise.resolve({} as OrderResponseDto);
  }

  @Get("download")
  @ApiOperation({ summary: "Download order export" })
  download() {
    return { csv: "dynamic" };
  }

  @Get("service-token")
  @ApiSecurity("apiKeyAuth")
  @ApiResponse({ status: 204, description: "Service token accepted." })
  serviceToken(): void {}
}
