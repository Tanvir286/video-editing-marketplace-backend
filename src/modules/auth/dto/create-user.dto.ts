import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserType } from 'prisma/generated';


export class CreateUserDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email address used for login and verification',
    example: 'john@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for the account',
    example: 'password123',
  })
  @MinLength(8, { message: 'Password should be minimum 8 characters' })
  password: string;

  @ApiPropertyOptional({
    description: 'Type of the user account',
    enum: UserType,
    default: UserType.CLIENT,
  })
  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;

  @ApiPropertyOptional({
    description: 'Availability status for the user',
    example: 'available',
  })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when the email was verified',
    example: '2026-08-01T10:00:00.000Z',
  })
  @IsOptional()
  email_verified_at?: Date;
}
