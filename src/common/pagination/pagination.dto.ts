import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class PaginationDto {

   @ApiProperty({
      default: 1,
      description: 'Page number',
      example: 1,
   })
   @IsOptional()
   @Type(() => Number)
   @IsInt()
   @Min(1)
   page?: number = 1;
  
   @ApiProperty({
      default: 10,
      description: 'Items per page',
      example: 10,
   })
   @IsOptional()
   @Type(() => Number)
   @IsInt()
   @Min(1)
   limit?: number = 10;
}

   