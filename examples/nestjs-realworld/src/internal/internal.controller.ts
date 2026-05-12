import { Controller, Get } from "@nestjs/common";

@Controller("internal")
export class InternalController {
  @Get("ping")
  ping(): string {
    return "pong";
  }
}
