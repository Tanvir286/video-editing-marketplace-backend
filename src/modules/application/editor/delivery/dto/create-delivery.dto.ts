import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeliveryDto {
  @ApiProperty({
    example: 'job-id-123',
    description: 'ID of the job being delivered',
  })
  @IsNotEmpty({ message: 'job_id is required' })
  @IsString()
  job_id: string;

  @ApiProperty({
    example: 'Here is the final completed video project.',
    description: 'Delivery description or message for the client',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Delivery file or project attachment',
    required: false,
  })
  @IsOptional()
  attachment_file?: any;
}
