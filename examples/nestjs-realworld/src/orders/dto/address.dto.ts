import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class AddressDto {
  @ApiProperty({ example: "221B Baker Street", description: "Street line" })
  @IsString()
  street: string;

  @ApiProperty({ example: "London" })
  @IsString()
  city: string;
}
