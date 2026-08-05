import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class CreateExtensionDto {
  @ApiProperty({
    example: 'I need 3 more days to complete the project properly.',
    description: 'Reason for requesting the extension',
  })
  @IsString()
  @MaxLength(500)
  message: string;

  @ApiProperty({
    example: 3,
    minimum: 1,
    description: 'Number of extra days requested',
  })
  @IsInt()
  @Min(1)
  extension_days: number;

   @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  image?: any;
}
