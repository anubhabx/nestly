import { Module } from "@nestjs/common";
import { OrdersController } from "./orders/orders.controller";
import { InternalController } from "./internal/internal.controller";

@Module({
  controllers: [OrdersController, InternalController],
})
export class AppModule {}
