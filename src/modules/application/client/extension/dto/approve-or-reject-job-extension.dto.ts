import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ExtensionStatus } from 'prisma/generated';

export class ApproveOrRejectJobExtensionDto {
  @ApiProperty({
    enum: ExtensionStatus,
    enumName: 'ExtensionStatus',
    example: ExtensionStatus.APPROVED,
    description: 'Status to approve or reject the time extension request (APPROVED or REJECTED)',
  })
  @IsNotEmpty()
  @IsEnum(ExtensionStatus, {
    message: 'status must be either APPROVED or REJECTED',
  })
  status: ExtensionStatus;
}
