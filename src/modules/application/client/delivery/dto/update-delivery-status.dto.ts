import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeliveryStatus } from 'prisma/generated';

export class UpdateDeliveryStatusDto {
  @ApiProperty({
    enum: DeliveryStatus,
    enumName: 'DeliveryStatus',
    example: DeliveryStatus.ACCEPTED,
    description: 'Delivery action status (ACCEPTED, REJECTED, or REVISION_REQUESTED)',
  })
  @IsNotEmpty({ message: 'status is required' })
  @IsEnum(DeliveryStatus, {
    message: 'status must be ACCEPTED, REJECTED, or REVISION_REQUESTED',
  })
  status: DeliveryStatus;

  @ApiProperty({
    example: 'Please adjust the color grading and audio levels in the intro.',
    description: 'Revision notes or feedback message for the editor',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}
